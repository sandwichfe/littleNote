import { computed, ref, type Ref } from 'vue';
import type { Editor } from '@tiptap/vue-3';
// useEditor 的回调里拿到的是 core 的 Editor（vue-3 的 Editor 只是它的子类），按父类收宽避免类型不兼容
import type { Editor as CoreEditor } from '@tiptap/core';
import {
  blockTypes,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR,
} from '../config';

// 颜色用途：文字色 / 背景色
export type ColorTarget = 'text' | 'background';
export type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

// 工具栏颜色事件负载：color 为 null 表示清除该颜色
export type ColorPayload = {
  type: ColorTarget;
  color: string | null;
  close?: boolean;
};

// 工具栏按钮激活态快照，供纯 UI 工具栏直接绑定
export type ToolbarActiveState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  link: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
};

// 无编辑器实例时的兜底状态，避免模板里到处判空
const EMPTY_ACTIVE_STATE: ToolbarActiveState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  link: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  codeBlock: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
};

// 无需自定义选区逻辑的简单命令
export type SimpleCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'blockquote'
  | 'horizontalRule'
  | 'clearFormat'
  | 'undo'
  | 'redo';

const SIMPLE_COMMANDS: Record<SimpleCommand, (chain: any) => any> = {
  bold: (chain) => chain.toggleBold(),
  italic: (chain) => chain.toggleItalic(),
  underline: (chain) => chain.toggleUnderline(),
  strike: (chain) => chain.toggleStrike(),
  code: (chain) => chain.toggleCode(),
  blockquote: (chain) => chain.toggleBlockquote(),
  horizontalRule: (chain) => chain.setHorizontalRule(),
  // 一次性去掉行内样式与块级格式，常用于粘贴外部内容后的清理
  clearFormat: (chain) => chain.unsetAllMarks().clearNodes(),
  undo: (chain) => chain.undo(),
  redo: (chain) => chain.redo(),
};

// 只接受 6 位 hex：粘贴带入的 rgb() 等值按默认色处理
const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/**
 * 编辑器工具栏状态与命令：块类型、字体、颜色、对齐，以及工具栏浮层显隐。
 * 组件只负责渲染，这里集中维护与 tiptap 的交互。
 */
export const useEditorToolbar = (editor: Ref<Editor | undefined>) => {
  // 下拉框 / 颜色指示条状态，随光标与选区变化
  const currentBlock = ref('paragraph');
  const currentFont = ref('');
  const textColor = ref(DEFAULT_TEXT_COLOR);
  const backgroundColor = ref(DEFAULT_BACKGROUND_COLOR);

  // 浮层互斥：同一时刻只允许一个工具栏浮层打开
  const showColorPalette = ref<ColorTarget | null>(null);
  const showTablePicker = ref(false);
  const showImagePanel = ref(false);
  const isSelectionInTable = ref(false);

  // 选区或内容变化后自增，触发 activeState 重算
  const toolbarTick = ref(0);

  const run = (fn: (chain: any) => any) => {
    if (!editor.value) return;
    fn(editor.value.chain().focus()).run();
  };

  const closeColorPalette = () => {
    showColorPalette.value = null;
  };

  const closeTablePicker = () => {
    showTablePicker.value = false;
  };

  const closeImagePanel = () => {
    showImagePanel.value = false;
  };

  const closeAllPopups = () => {
    closeColorPalette();
    closeTablePicker();
    closeImagePanel();
  };

  const toggleColorPalette = (type: ColorTarget) => {
    showColorPalette.value = showColorPalette.value === type ? null : type;
    closeTablePicker();
    closeImagePanel();
  };

  const toggleImagePanel = () => {
    showImagePanel.value = !showImagePanel.value;
    closeTablePicker();
    closeColorPalette();
  };

  const toggleTablePicker = () => {
    // 单元格内不能嵌套表格
    if (isSelectionInTable.value) return;
    showTablePicker.value = !showTablePicker.value;
    closeColorPalette();
    closeImagePanel();
  };

  // 跟随光标同步工具栏展示状态，编辑器每次选区/内容变动都会调用
  const syncToolbarState = (targetEditor?: CoreEditor) => {
    if (!targetEditor) return;

    const heading = blockTypes.find((item) => {
      if (item.value === 'paragraph') return false;
      return targetEditor.isActive('heading', { level: Number(item.value.replace('heading-', '')) });
    });
    currentBlock.value = heading?.value ?? 'paragraph';

    const textStyleAttrs = targetEditor.getAttributes('textStyle');
    currentFont.value = textStyleAttrs.fontFamily || '';
    // 颜色指示条跟随光标所在文本；非 hex 值（如粘贴带入的 rgb()）按默认色处理
    textColor.value = isHexColor(textStyleAttrs.color) ? textStyleAttrs.color : DEFAULT_TEXT_COLOR;
    const highlightAttrs = targetEditor.getAttributes('highlight');
    backgroundColor.value = isHexColor(highlightAttrs.color)
      ? highlightAttrs.color
      : DEFAULT_BACKGROUND_COLOR;

    isSelectionInTable.value = targetEditor.isActive('table');
    if (isSelectionInTable.value) {
      closeTablePicker();
      closeColorPalette();
    }

    // tiptap 的 isActive / can() 不是响应式来源，用 tick 驱动 activeState 重算
    toolbarTick.value++;
  };

  const activeState = computed<ToolbarActiveState>(() => {
    void toolbarTick.value;
    const instance = editor.value;
    if (!instance) return EMPTY_ACTIVE_STATE;

    return {
      bold: instance.isActive('bold'),
      italic: instance.isActive('italic'),
      underline: instance.isActive('underline'),
      strike: instance.isActive('strike'),
      code: instance.isActive('code'),
      link: instance.isActive('link'),
      bulletList: instance.isActive('bulletList'),
      orderedList: instance.isActive('orderedList'),
      blockquote: instance.isActive('blockquote'),
      codeBlock: instance.isActive('codeBlock'),
      alignLeft: instance.isActive({ textAlign: 'left' }),
      alignCenter: instance.isActive({ textAlign: 'center' }),
      alignRight: instance.isActive({ textAlign: 'right' }),
      alignJustify: instance.isActive({ textAlign: 'justify' }),
    };
  });

  const canUndo = computed(() => {
    void toolbarTick.value;
    return editor.value?.can().undo() ?? false;
  });

  const canRedo = computed(() => {
    void toolbarTick.value;
    return editor.value?.can().redo() ?? false;
  });

  const runCommand = (name: SimpleCommand) => {
    const command = SIMPLE_COMMANDS[name];
    if (command) run(command);
  };

  // 块类型：paragraph 与 heading-1 ~ heading-6
  const setBlockType = (value: string) => {
    currentBlock.value = value;
    if (value === 'paragraph') {
      run((chain) => chain.setParagraph());
      return;
    }

    const level = Number(value.replace('heading-', ''));
    run((chain) => chain.setHeading({ level }));
  };

  const setFontFamily = (value: string) => {
    currentFont.value = value;
    if (value) run((chain) => chain.setFontFamily(value));
    else run((chain) => chain.unsetFontFamily());
  };

  const setTextAlign = (value: TextAlignValue) => run((chain) => chain.setTextAlign(value));

  const getActiveHeadingLevel = () => {
    if (!editor.value) return null;

    for (const item of blockTypes) {
      if (item.value === 'paragraph') continue;

      const level = Number(item.value.replace('heading-', ''));
      if (editor.value.isActive('heading', { level })) return level;
    }

    return null;
  };

  // 切换列表时保留原有标题级别，避免标题变列表后丢失层级
  const toggleList = (listType: 'bulletList' | 'orderedList') => {
    if (!editor.value) return;

    const shouldRestoreHeading = editor.value.isActive(listType);
    const headingLevel = shouldRestoreHeading ? getActiveHeadingLevel() : null;
    const chain = editor.value.chain().focus();

    if (listType === 'bulletList') {
      chain.toggleBulletList();
    } else {
      chain.toggleOrderedList();
    }

    if (headingLevel) {
      // getActiveHeadingLevel 只从 blockTypes 里取值，必然是 1~6
      chain.setHeading({ level: headingLevel as 1 | 2 | 3 | 4 | 5 | 6 });
    }

    chain.run();
  };

  // 设置或清除文字色 / 背景色，close 用于选色后收起浮层
  const setColor = ({ type, color, close }: ColorPayload) => {
    if (color !== null && !isHexColor(color)) return;

    if (type === 'text') {
      textColor.value = color ?? DEFAULT_TEXT_COLOR;
      if (color) run((chain) => chain.setColor(color));
      else run((chain) => chain.unsetColor());
    } else {
      backgroundColor.value = color ?? DEFAULT_BACKGROUND_COLOR;
      if (color) run((chain) => chain.setHighlight({ color }));
      else run((chain) => chain.unsetHighlight());
    }

    if (close) closeColorPalette();
  };

  return {
    currentBlock,
    currentFont,
    textColor,
    backgroundColor,
    showColorPalette,
    showTablePicker,
    showImagePanel,
    isSelectionInTable,
    activeState,
    canUndo,
    canRedo,
    syncToolbarState,
    runCommand,
    setBlockType,
    setFontFamily,
    setTextAlign,
    toggleList,
    setColor,
    toggleColorPalette,
    toggleImagePanel,
    toggleTablePicker,
    closeColorPalette,
    closeImagePanel,
    closeTablePicker,
    closeAllPopups,
  };
};
