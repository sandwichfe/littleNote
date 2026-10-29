<template>
  <div ref="rootRef" class="rich-editor" :class="{ 'is-preview': !editable }">
    <!-- 工具栏只负责渲染与抛命令，状态与命令由 useEditorToolbar 维护 -->
    <EditorToolbar
      v-if="editable && editor"
      v-model:network-image-url="networkImageUrl"
      v-model:network-image-name="networkImageName"
      :block-type="currentBlock"
      :font="currentFont"
      :text-color="textColor"
      :background-color="backgroundColor"
      :color-palette="showColorPalette"
      :table-picker-visible="showTablePicker"
      :image-panel-visible="showImagePanel"
      :selection-in-table="isSelectionInTable"
      :active="activeState"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @set-block="setBlockType"
      @set-font="setFontFamily"
      @run-command="runCommand"
      @open-link="openLinkDialog"
      @set-align="setTextAlign"
      @toggle-list="toggleList"
      @toggle-code-block="toggleCodeBlock"
      @set-color="setColor"
      @toggle-color-palette="toggleColorPalette"
      @toggle-table-picker="toggleTablePicker"
      @insert-table="insertTable"
      @toggle-image-panel="toggleImagePanel"
      @pick-image="closeImagePanel"
      @insert-network-image="handleInsertNetworkImage"
      @select-file="onSelectFile"
    />

    <div class="re-editor-shell">
      <!-- 头部插槽：供调用方放置标题等，位于正文之上且不随正文滚动 -->
      <div v-if="$slots.header" class="re-header">
        <slot name="header"/>
      </div>
      <!-- 上传进度：顶部细条，不遮挡正文 -->
      <div v-if="uploadPercent !== null" class="re-upload-progress" :title="`上传中 ${uploadPercent}%`">
        <span class="re-upload-progress-bar" :style="{ width: `${uploadPercent}%` }"></span>
      </div>
      <div
        v-if="editable && editor && tableToolbar.visible"
        ref="tableToolbarRef"
        class="re-table-toolbar"
        :style="{ top: `${tableToolbar.top}px`, left: `${tableToolbar.left}px` }"
        @mousedown.prevent
      >
        <button class="re-table-tool" type="button" title="在上方插入行" @click="runTableCommand('addRowBefore')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v5H4V4zm0 7h16v9H4v-9zm7-5v1h8V6h-8zm0 8v4h8v-4h-8zM6 14v4h3v-4H6zM6 6v1h3V6H6z"/><path d="M12 2h2v2h3v2h-3v2h-2V6H9V4h3V2z"/></svg>
        </button>
        <button class="re-table-tool" type="button" title="在下方插入行" @click="runTableCommand('addRowAfter')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v9H4V4zm0 11h16v5H4v-5zm7-9v4h8V6h-8zm0 11v1h8v-1h-8zM6 6v4h3V6H6zM6 17v1h3v-1H6z"/><path d="M12 16h2v2h3v2h-3v2h-2v-2H9v-2h3v-2z"/></svg>
        </button>
        <span class="re-table-tool-sep"></span>
        <button class="re-table-tool" type="button" title="在左侧插入列" @click="runTableCommand('addColumnBefore')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h5v16H4V4zm7 0h9v16h-9V4zM6 6v3h1V6H6zm0 5v7h1v-7H6zm8-5v3h4V6h-4zm0 5v7h4v-7h-4z"/><path d="M2 12h2V9h2v3h2v2H6v3H4v-3H2v-2z"/></svg>
        </button>
        <button class="re-table-tool" type="button" title="在右侧插入列" @click="runTableCommand('addColumnAfter')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h9v16H4V4zm11 0h5v16h-5V4zM6 6v3h4V6H6zm0 5v7h4v-7H6zm11-5v3h1V6h-1zm0 5v7h1v-7h-1z"/><path d="M16 12h2V9h2v3h2v2h-2v3h-2v-3h-2v-2z"/></svg>
        </button>
        <span class="re-table-tool-sep"></span>
        <button class="re-table-tool" type="button" title="删除行" @click="runTableCommand('deleteRow')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v5H4V4zm0 7h16v9H4v-9zm2-5v1h12V6H6zm0 8v4h12v-4H6z"/><path d="M8 12h8v2H8v-2z"/></svg>
        </button>
        <button class="re-table-tool" type="button" title="删除列" @click="runTableCommand('deleteColumn')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h5v16H4V4zm7 0h9v16h-9V4zM6 6v12h1V6H6zm8 0v12h4V6h-4z"/><path d="M11 11h9v2h-9v-2z"/></svg>
        </button>
        <span class="re-table-tool-sep"></span>
        <button class="re-table-tool danger" type="button" title="删除表格" @click="runTableCommand('deleteTable')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3h8l1 2h4v2H3V5h4l1-2zm-2 6h12l-1 12H7L6 9zm3 2 .5 8h1.5l-.5-8H9zm4 0-.5 8H14l.5-8H13z"/></svg>
        </button>
      </div>
      <editor-content :editor="editor" class="re-content" @mousedown="onEditorBlankMouseDown" @scroll="updateTableToolbarPosition" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Italic from '@tiptap/extension-italic';
import TextAlign from '@tiptap/extension-text-align';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Selection, TextSelection } from '@tiptap/pm/state';
import Link from '@tiptap/extension-link';
import { common, createLowlight } from 'lowlight';
import { ElMessageBox } from 'element-plus';
import { TABLE_TOOLBAR_FALLBACK_WIDTH, TABLE_TOOLBAR_OFFSET } from './config';
import { CodeBlockWithTools } from './extensions/CodeBlockWithTools';
import { ImageWithSize } from './extensions/ImageWithSize';
import { ListItemWithHeading, TableWithResizableColumns } from './extensions/basicExtensions';
import { Placeholder } from './extensions/Placeholder';
import { getSelectionDeleteLineRange } from './utils/deleteLine';
import { Video } from './VideoNode';
import EditorToolbar from './EditorToolbar.vue';
import { useEditorToolbar } from './composables/useEditorToolbar';
import { useMediaUpload } from './composables/useMediaUpload';
import 'highlight.js/styles/atom-one-light.css';

const props = withDefaults(defineProps<{ modelValue: string; editable?: boolean }>(), {
  modelValue: '',
  editable: true,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  // 内容一变动就立即通知（不带内容），供调用方做未保存标记
  (e: 'change'): void;
  // 用 kebab 事件名，模板监听 @update:char-count 才能稳定匹配
  (e: 'update:char-count', value: number): void;
}>();

// 对外 emit 的防抖间隔：避免每个字符都序列化整篇文档
const EMIT_DELAY = 200;
let emitTimer: ReturnType<typeof setTimeout> | null = null;
// 待消费的"自身发出内容"，仅用于识别紧随其后的 v-model 回流；消费后置空
let emittedHtml: string | null = null;

const lowlight = createLowlight(common);

const rootRef = ref<HTMLElement>();
const tableToolbarRef = ref<HTMLElement>();
const tableToolbar = reactive({
  visible: false,
  top: 0,
  left: 0,
});

// 正文字数：只统计可见文本，不含格式与标记
const syncCharCount = (targetEditor?: any) => {
  if (!targetEditor) return;
  emit('update:char-count', targetEditor.state.doc.textContent.length);
};

const hideTableToolbar = () => {
  tableToolbar.visible = false;
};

const getSelectedTableElement = () => {
  if (!editor.value?.isActive('table')) return null;

  const proseMirror = rootRef.value?.querySelector<HTMLElement>('.ProseMirror');
  const selectionNode = editor.value.view.domAtPos(editor.value.state.selection.from).node;
  const startElement =
    selectionNode.nodeType === globalThis.Node.ELEMENT_NODE
      ? (selectionNode as HTMLElement)
      : selectionNode.parentElement;

  return startElement?.closest?.('.tableWrapper') as HTMLElement | null
    || startElement?.closest?.('table')?.parentElement as HTMLElement | null
    || proseMirror?.querySelector<HTMLElement>('.selectedCell')?.closest?.('.tableWrapper')
    || null;
};

let positionFrame = 0;

const updateTableToolbarPosition = () => {
  // 光标不在表格里时直接收起，省掉后面的 DOM 查询与布局读取
  if (!props.editable || !editor.value || !editor.value.isActive('table')) {
    hideTableToolbar();
    return;
  }

  // 打字时 selectionUpdate 很频繁，合并到下一帧再测量
  if (positionFrame) return;
  positionFrame = requestAnimationFrame(() => {
    positionFrame = 0;

    nextTick(() => {
      const shell = rootRef.value?.querySelector<HTMLElement>('.re-editor-shell');
      const tableElement = getSelectedTableElement();

      if (!shell || !tableElement) {
        hideTableToolbar();
        return;
      }

      const shellRect = shell.getBoundingClientRect();
      const tableRect = tableElement.getBoundingClientRect();
      const measuredToolbarWidth = tableToolbarRef.value?.offsetWidth;
      const toolbarWidth = measuredToolbarWidth || TABLE_TOOLBAR_FALLBACK_WIDTH;
      const toolbarLeft =
        tableRect.right - shellRect.left + shell.scrollLeft - toolbarWidth;

      tableToolbar.left = Math.max(8, toolbarLeft);
      tableToolbar.top = Math.max(
        8,
        tableRect.top - shellRect.top + shell.scrollTop - 44 - TABLE_TOOLBAR_OFFSET
      );
      tableToolbar.visible = true;
      if (!measuredToolbarWidth) nextTick(updateTableToolbarPosition);
    });
  });
};

// 点击工具栏以外区域（含正文与页面其他位置）统一收起对应浮层
const onDocumentMouseDown = (event: MouseEvent) => {
  const target = event.target as Element | null;
  if (!target?.closest?.('.re-toolbar .re-color-wrapper')) closeColorPalette();
  if (!target?.closest?.('.re-toolbar .re-table-insert')) closeTablePicker();
  if (!target?.closest?.('.re-toolbar .re-image-insert')) closeImagePanel();
};

const onDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeAllPopups();
};

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({ codeBlock: false, listItem: false }),
    ListItemWithHeading,
    Placeholder.configure({ text: '开始输入…' }),
    TextStyle,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    Underline,
    Strike,
    Italic,
    // openOnClick 关闭，避免编辑时误点链接跳出并丢失未保存内容
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ImageWithSize.configure({ inline: true }),
    TableWithResizableColumns.configure({
      resizable: true,
      renderWrapper: true,
      cellMinWidth: 80,
    }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockWithTools.configure({ lowlight }),
    Video,
  ],
  onCreate: ({ editor }) => {
    syncToolbarState(editor);
    syncCharCount(editor);
    updateTableToolbarPosition();
  },
  onUpdate: ({ editor }) => {
    // 立即通知调用方"内容已变"，避免脏标记被序列化防抖拖慢
    emit('change');
    syncToolbarState(editor);
    updateTableToolbarPosition();

    // 连续输入时不逐字序列化整篇文档，等停手后再同步给父级
    if (emitTimer) clearTimeout(emitTimer);
    emitTimer = setTimeout(() => {
      emitTimer = null;
      emittedHtml = editor.getHTML();
      emit('update:modelValue', emittedHtml);
      syncCharCount(editor);
    }, EMIT_DELAY);
  },
  onSelectionUpdate: ({ editor }) => {
    syncToolbarState(editor);
    updateTableToolbarPosition();
  },
  editorProps: {
    handlePaste: (view, event) => {
      const clipboard = event.clipboardData;
      if (!clipboard) return false;

      // 剪贴板同时含文字或 HTML 时交给默认粘贴，避免只保留图片而丢掉文字
      if (clipboard.getData('text/html') || clipboard.getData('text/plain').trim()) return false;

      const imageFile = getImageFileFromClipboard(event);
      if (!imageFile) return false;

      event.preventDefault();
      void insertUploadedImage(imageFile, view.state.selection.from);
      return true;
    },
    // 拖拽文件到编辑区时走上传，落点即插入位置
    handleDrop: (view, event, _slice, moved) => {
      // 只读态与文档内部拖动都交给 ProseMirror / 浏览器处理
      if (!props.editable || moved) return false;

      const files = Array.from(event.dataTransfer?.files || []);
      const mediaFile = files.find(
        (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      if (!mediaFile) return false;

      event.preventDefault();
      const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
      void insertUploadedMedia(mediaFile, coords?.pos);
      return true;
    },
  },
});

// 工具栏状态与命令（块类型 / 字体 / 颜色 / 对齐 / 浮层显隐）
const {
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
} = useEditorToolbar(editor);

// 图片 / 视频上传：进度、校验与落点插入
const {
  uploadPercent,
  networkImageUrl,
  networkImageName,
  insertUploadedImage,
  insertUploadedMedia,
  insertNetworkImage,
  getImageFileFromClipboard,
  onSelectFile,
} = useMediaUpload(editor);

watch(
  () => props.modelValue,
  (val) => {
    const instance = editor.value;
    if (!instance) return;

    // 编辑器自己发出的更新回流：消费掉标记即可，不必再比较与重设内容
    if (val === emittedHtml) {
      emittedHtml = null;
      return;
    }

    // 外部替换内容前取消待发出的防抖任务，避免旧内容覆盖新内容
    if (emitTimer) {
      clearTimeout(emitTimer);
      emitTimer = null;
    }

    if (val !== instance.getHTML()) {
      instance.commands.setContent(val || '', false);
      syncToolbarState(instance);
      // 程序化回填不会触发 onUpdate，这里补一次字数同步
      syncCharCount(instance);
    }
  }
);

watch(
  () => props.editable,
  (val) => {
    // 第二个参数关掉 emitUpdate：切换只读/编辑只是视图状态，不该被当成"内容改了"
    editor.value?.setEditable(val, false);
  }
);

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown);
  document.addEventListener('keydown', onDocumentKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown);
  document.removeEventListener('keydown', onDocumentKeyDown);
  if (emitTimer) clearTimeout(emitTimer);
  if (positionFrame) cancelAnimationFrame(positionFrame);
  editor.value?.destroy();
});

const onEditorBlankMouseDown = (event: MouseEvent) => {
  if (!props.editable || !editor.value) return;

  const target = event.target as HTMLElement;
  const proseMirror = rootRef.value?.querySelector<HTMLElement>('.ProseMirror');
  if (!proseMirror || target !== proseMirror) return;

  const { state, view } = editor.value;
  const firstNode = state.doc.firstChild;
  const lastNode = state.doc.lastChild;
  const firstElement = proseMirror.firstElementChild as HTMLElement | null;
  const lastElement = proseMirror.lastElementChild as HTMLElement | null;
  const firstRect = firstElement?.getBoundingClientRect();
  const lastRect = lastElement?.getBoundingClientRect();
  const isBeforeFirstCodeBlock =
    firstNode?.type.name === 'codeBlock' && !!firstRect && event.clientY < firstRect.top;
  const isAfterLastCodeBlock =
    lastNode?.type.name === 'codeBlock' && !!lastRect && event.clientY > lastRect.bottom;

  if (!isBeforeFirstCodeBlock && !isAfterLastCodeBlock) return;

  event.preventDefault();
  const insertPos = isBeforeFirstCodeBlock ? 0 : state.doc.content.size;
  const paragraph = state.schema.nodes.paragraph.create();
  const tr = state.tr.insert(insertPos, paragraph);

  tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
  view.dispatch(tr.scrollIntoView());
  view.focus();
};

// 需要自定义选区逻辑的命令（代码块、表格、多段替换等）仍走这里的通用通道
const run = (fn: (chain: any) => any) => {
  if (!editor.value) return;
  fn(editor.value.chain().focus()).run();
};

const collectTextBlockLines = (node: ProseMirrorNode): string[] => {
  if (node.isTextblock) {
    return [node.textBetween(0, node.content.size, '\n')];
  }

  const lines: string[] = [];
  node.forEach((child) => {
    lines.push(...collectTextBlockLines(child));
  });
  return lines;
};

const getSelectedTextWithBlockBreaks = () => {
  if (!editor.value) return '';

  const lines: string[] = [];
  const fragment = editor.value.state.selection.content().content;

  // 直接 textBetween 在部分浏览器选区下会丢段落分隔，这里按文本块显式补换行。
  fragment.forEach((node) => {
    lines.push(...collectTextBlockLines(node));
  });

  return lines.join('\n');
};

const insertEmptyCodeBlockAfterCurrentTextBlock = () => {
  if (!editor.value) return false;

  const { state, view } = editor.value;
  const { $from } = state.selection;
  if (!$from.parent.isTextblock) return false;

  // 没有选中文字时只在光标所在块后插入空代码块，不主动转换已有内容。
  const insertPos = $from.after($from.depth);
  const codeBlock = state.schema.nodes.codeBlock.create();
  const tr = state.tr.insert(insertPos, codeBlock);
  const selectionPos = insertPos + 1;

  tr.setSelection(TextSelection.create(tr.doc, selectionPos));
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
};

const toggleCodeBlock = () => {
  if (!editor.value) return;

  const { state, view } = editor.value;
  const { from, to, empty } = state.selection;
  const selectedText = getSelectedTextWithBlockBreaks();

  if (empty || !selectedText) {
    insertEmptyCodeBlockAfterCurrentTextBlock();
    return;
  }

  if (editor.value.isActive('codeBlock')) {
    run((c) => c.toggleCodeBlock());
    return;
  }

  // 多段文本选区应合并成一个代码块，符合 Notion、飞书文档、语雀等编辑器的常见交互。
  const codeBlock = state.schema.nodes.codeBlock.create(null, state.schema.text(selectedText));
  const tr = state.tr.replaceRangeWith(from, to, codeBlock);
  let selectionPos = tr.selection.from;

  tr.doc.nodesBetween(
    Math.max(0, from - 2),
    Math.min(tr.doc.content.size, from + codeBlock.nodeSize + 2),
    (node, pos) => {
      if (node.type.name !== 'codeBlock' || node.textContent !== selectedText) return true;
      selectionPos = pos + node.nodeSize - 1;
      return false;
    }
  );

  tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
  view.dispatch(tr.scrollIntoView());
  view.focus();
};

// 省略协议时补 https://，兼容 http、mailto、tel 与站内相对路径
const normalizeUrl = (input: string) => {
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(input)) return input;
  return `https://${input}`;
};

// 链接弹窗：留空表示移除当前链接
const openLinkDialog = async () => {
  const instance = editor.value;
  if (!instance) return;

  const currentHref = (instance.getAttributes('link').href as string) || '';
  let input: string;

  try {
    const { value } = await ElMessageBox.prompt(
      '请输入链接地址，留空则移除链接',
      currentHref ? '编辑链接' : '插入链接',
      {
        inputValue: currentHref,
        inputPlaceholder: 'https://example.com',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    );
    input = (value || '').trim();
  } catch {
    return; // 用户取消
  }

  const chain = instance.chain().focus();

  if (!input) {
    chain.extendMarkRange('link').unsetLink().run();
    return;
  }

  const href = normalizeUrl(input);

  // 没有选中文字且光标不在链接上时，直接把地址插入为链接文本
  if (instance.state.selection.empty && !currentHref) {
    chain
      .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
      .run();
    return;
  }

  chain.extendMarkRange('link').setLink({ href }).run();
};

// 工具栏选完表格尺寸后插入表格并定位浮动表头
const insertTable = ({ rows, cols }: { rows: number; cols: number }) => {
  closeTablePicker();
  run((c) => c.insertTable({ rows, cols, withHeaderRow: true }));
  updateTableToolbarPosition();
};

const runTableCommand = (
  command:
    | 'addRowBefore'
    | 'addRowAfter'
    | 'addColumnBefore'
    | 'addColumnAfter'
    | 'deleteRow'
    | 'deleteColumn'
    | 'deleteTable'
) => {
  if (!editor.value) return;

  editor.value.chain().focus()[command]().run();
  if (command === 'deleteTable') {
    hideTableToolbar();
  } else {
    updateTableToolbarPosition();
  }
};

// 网络图片插入成功后才收起面板，校验失败时保留用户已填内容
const handleInsertNetworkImage = () => {
  if (insertNetworkImage()) closeImagePanel();
};

const getHTML = () => editor.value?.getHTML() ?? '';

// 对外提供编辑器纯文本，避免调用方再从 HTML 中解析正文。
const getText = () => editor.value?.getText({ blockSeparator: '\n' }) ?? '';

const deleteCurrentLine = () => {
  if (!props.editable || !editor.value) return false;

  const { state, view } = editor.value;

  if (editor.value.isActive('table')) {
    editor.value.chain().focus().deleteRow().run();
    updateTableToolbarPosition();
    return true;
  }

  const range = getSelectionDeleteLineRange(state);
  if (!range) return false;

  const paragraph = state.schema.nodes.paragraph.create();
  const isOnlyBlock = range.from === 0 && range.to === state.doc.content.size;
  const tr = isOnlyBlock ? state.tr.replaceWith(range.from, range.to, paragraph) : state.tr.delete(range.from, range.to);
  const nextPos = Math.min(range.from, tr.doc.content.size);

  tr.setSelection(Selection.near(tr.doc.resolve(nextPos), 1));
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
};

defineExpose({ getHTML, getText, deleteCurrentLine });
</script>

<style scoped src="./styles.css"></style>
