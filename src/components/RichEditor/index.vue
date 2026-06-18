<template>
  <div ref="rootRef" class="rich-editor">
    <div v-if="editable && editor" class="re-toolbar">
      <div class="re-toolbar-row">
        <!-- 正文 / 标题 -->
        <select class="re-select re-block-select" :value="currentBlock" @change="onBlockChange">
          <option v-for="item in blockTypes" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>

        <!-- 字体 -->
        <select class="re-select re-font-select" :value="currentFont" @change="onFontChange">
          <option value="">默认</option>
          <option v-for="f in fonts" :key="f.value" :value="f.value" :style="{ fontFamily: f.value }">
            {{ f.label }}
          </option>
        </select>

        <span class="re-sep"></span>

        <!-- 加粗 / 斜体 / 下划线 -->
        <button class="re-btn" :class="{ active: editor.isActive('bold') }"
                @click="run(c => c.toggleBold())" title="加粗 (Ctrl+B)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive('italic') }"
                @click="run(c => c.toggleItalic())" title="斜体 (Ctrl+I)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive('underline') }"
                @click="run(c => c.toggleUnderline())" title="下划线 (Ctrl+U)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive('strike') }"
                @click="run(c => c.toggleStrike())" title="删除线">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
        </button>

        <span class="re-sep"></span>

        <!-- 文字颜色 -->
        <div class="re-color-wrapper">
          <button class="re-btn re-color-btn" type="button" title="文字颜色">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11 3 5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/></svg>
            <span class="re-color-bar" :style="{ backgroundColor: currentColor }"></span>
          </button>
          <label class="re-color-picker">
            <input type="color" :value="currentColor" @input="onColor" />
          </label>
        </div>

        <!-- 背景色 -->
        <div class="re-color-wrapper">
          <button class="re-btn re-color-btn" type="button" title="背景色">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16.56 8.94 7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10 10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/></svg>
            <span class="re-color-bar" :style="{ backgroundColor: currentBg }"></span>
          </button>
          <label class="re-color-picker">
            <input type="color" :value="currentBg" @input="onBg" />
          </label>
        </div>

        <span class="re-sep"></span>

        <!-- 列表 -->
        <button class="re-btn" :class="{ active: editor.isActive('bulletList') }"
                @click="run(c => c.toggleBulletList())" title="无序列表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive('orderedList') }"
                @click="run(c => c.toggleOrderedList())" title="有序列表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
        </button>

        <span class="re-sep"></span>

        <!-- 对齐 -->
        <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }"
                @click="run(c => c.setTextAlign('left'))" title="左对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }"
                @click="run(c => c.setTextAlign('center'))" title="居中对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }"
                @click="run(c => c.setTextAlign('right'))" title="右对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'justify' }) }"
                @click="run(c => c.setTextAlign('justify'))" title="两端对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/></svg>
        </button>

        <span class="re-sep"></span>

        <!-- 插入 -->
        <button class="re-btn" :class="{ active: editor.isActive('codeBlock') }"
                @click="run(c => c.toggleCodeBlock())" title="代码块">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </button>
        <button class="re-btn" @click="pickImage" title="插入图片">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
        <button class="re-btn" @click="pickVideo" title="插入视频">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
        </button>
        <button class="re-btn" @click="insertTable" title="插入表格">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/></svg>
        </button>
        <button class="re-btn" @click="run(c => c.setHorizontalRule())" title="分割线">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>
        </button>

        <span class="re-sep"></span>

        <!-- 撤销 / 重做 -->
        <button class="re-btn" :disabled="!editor.can().undo()"
                @click="run(c => c.undo())" title="撤销 (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        </button>
        <button class="re-btn" :disabled="!editor.can().redo()"
                @click="run(c => c.redo())" title="重做 (Ctrl+Y)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
        </button>
      </div>

      <input ref="imageInput" type="file" accept="image/*" hidden @change="onImageChange" />
      <input ref="videoInput" type="file" accept="video/*" hidden @change="onVideoChange" />
    </div>

    <editor-content :editor="editor" class="re-content" @mousedown="onEditorBlankMouseDown" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
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
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import type { NodeViewRendererProps } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { columnResizing, tableEditing } from '@tiptap/pm/tables';
import type { ViewMutationRecord } from '@tiptap/pm/view';
import { common, createLowlight } from 'lowlight';
import { ElMessage } from 'element-plus';
import { uploadImage } from '@/network/base';
import { Video } from './VideoNode';
import 'highlight.js/styles/github.css';

const props = withDefaults(defineProps<{ modelValue: string; editable?: boolean }>(), {
  modelValue: '',
  editable: true,
});
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const lowlight = createLowlight(common);

const fonts = [
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: '等宽 Monospace', value: 'Consolas, Monaco, monospace' },
];

const blockTypes = [
  { label: '正文', value: 'paragraph' },
  { label: '标题 1', value: 'heading-1' },
  { label: '标题 2', value: 'heading-2' },
  { label: '标题 3', value: 'heading-3' },
  { label: '标题 4', value: 'heading-4' },
  { label: '标题 5', value: 'heading-5' },
  { label: '标题 6', value: 'heading-6' },
];

const codeLanguages = [
  { label: '自动 / 纯文本', value: '' },
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML / XML', value: 'xml' },
  { label: 'CSS', value: 'css' },
  { label: 'SCSS', value: 'scss' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Bash', value: 'bash' },
  { label: 'Shell', value: 'shell' },
  { label: 'SQL', value: 'sql' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Swift', value: 'swift' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Diff', value: 'diff' },
];

const rootRef = ref<HTMLElement>();
const imageInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();
const currentBlock = ref('paragraph');
const currentFont = ref('');
const currentColor = ref('#000000');
const currentBg = ref('#ffff00');

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const copyText = async (text: string) => {
  if (!text) {
    ElMessage.warning('当前代码块没有可复制的内容');
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    ElMessage.success('代码已复制');
  } catch (err) {
    console.error('代码复制失败:', err);
    ElMessage.error('代码复制失败');
  }
};

const syncToolbarState = (targetEditor?: any) => {
  if (!targetEditor) return;

  const heading = blockTypes.find((item) => {
    if (item.value === 'paragraph') return false;
    return targetEditor.isActive('heading', { level: Number(item.value.replace('heading-', '')) });
  });
  currentBlock.value = heading?.value ?? 'paragraph';

  currentFont.value = targetEditor.getAttributes('textStyle').fontFamily || '';

  const activeColor = targetEditor.getAttributes('textStyle').color;
  if (isHexColor(activeColor)) currentColor.value = activeColor;

  const activeBg = targetEditor.getAttributes('highlight').color;
  if (isHexColor(activeBg)) currentBg.value = activeBg;

};

const createCodeBlockView = ({ node, view, getPos, HTMLAttributes }: NodeViewRendererProps) => {
  let currentNode = node;
  const pre = document.createElement('pre');
  Object.entries(HTMLAttributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) pre.setAttribute(key, String(value));
  });

  const tools = document.createElement('div');
  tools.className = 're-code-tools';
  tools.contentEditable = 'false';
  tools.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });

  const toolsLeft = document.createElement('div');
  toolsLeft.className = 're-code-tools-left';

  const select = document.createElement('select');
  select.className = 're-code-language';
  select.title = '代码语言';
  select.addEventListener('change', () => {
    const pos = getPos();
    if (typeof pos !== 'number') return;

    const current = view.state.doc.nodeAt(pos);
    if (!current) return;

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...current.attrs,
        language: select.value || null,
      })
    );
  });
  codeLanguages.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
  toolsLeft.appendChild(select);
  tools.appendChild(toolsLeft);

  const toolsRight = document.createElement('div');
  toolsRight.className = 're-code-tools-right';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 're-code-copy';
  button.innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  button.setAttribute('aria-label', '复制代码');
  button.title = '复制代码';
  button.addEventListener('click', () => {
    void copyText(code.textContent || '');
  });
  toolsRight.appendChild(button);
  tools.appendChild(toolsRight);

  const code = document.createElement('code');
  pre.append(tools, code);

  const updateLanguage = (language: string) => {
    select.value = language;
    if (language) {
      pre.dataset.language = language;
      code.className = `language-${language}`;
    } else {
      delete pre.dataset.language;
      code.removeAttribute('class');
    }
  };
  updateLanguage(node.attrs.language || '');

  return {
    dom: pre,
    contentDOM: code,
    update: (updatedNode) => {
      if (updatedNode.type !== currentNode.type) return false;
      currentNode = updatedNode;
      updateLanguage(updatedNode.attrs.language || '');
      return true;
    },
    stopEvent: (event: Event) => tools.contains(event.target as globalThis.Node),
    ignoreMutation: (mutation: ViewMutationRecord) =>
      tools.contains(mutation.target as globalThis.Node),
  };
};

const CodeBlockWithTools = CodeBlockLowlight.extend({
  addNodeView() {
    return createCodeBlockView;
  },
});

const TableWithResizableColumns = Table.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.options.resizable
        ? [
            columnResizing({
              handleWidth: this.options.handleWidth,
              cellMinWidth: this.options.cellMinWidth,
              defaultCellMinWidth: this.options.cellMinWidth,
              View: this.options.View,
              lastColumnResizable: this.options.lastColumnResizable,
            }),
          ]
        : []),
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
    ];
  },
});

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    TextStyle,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    Underline,
    Strike,
    Italic,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ inline: false }),
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
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
    syncToolbarState(editor);
  },
  onSelectionUpdate: ({ editor }) => {
    syncToolbarState(editor);
  },
});

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val || '', false);
      syncToolbarState(editor.value);
    }
  }
);

watch(
  () => props.editable,
  (val) => {
    editor.value?.setEditable(val);
  }
);

onBeforeUnmount(() => editor.value?.destroy());

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

const run = (fn: (chain: any) => any) => {
  if (!editor.value) return;
  fn(editor.value.chain().focus()).run();
};

const onBlockChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  currentBlock.value = val;
  if (val === 'paragraph') {
    run((c) => c.setParagraph());
    return;
  }

  const level = Number(val.replace('heading-', ''));
  run((c) => c.setHeading({ level }));
};

const onFontChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  currentFont.value = val;
  if (val) run((c) => c.setFontFamily(val));
  else run((c) => c.unsetFontFamily());
};

const applyTextColor = () => run((c) => c.setColor(currentColor.value));
const onColor = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  currentColor.value = val;
  applyTextColor();
};

const clearTextColor = () => run((c) => c.unsetColor());

const applyBgColor = () => run((c) => c.setHighlight({ color: currentBg.value }));
const onBg = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  currentBg.value = val;
  applyBgColor();
};

const clearBgColor = () => run((c) => c.unsetHighlight());

const insertTable = () =>
  run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }));

const pickImage = () => imageInput.value?.click();
const pickVideo = () => videoInput.value?.click();

const doUpload = async (file: File) => {
  const res = await uploadImage(file);
  return `${import.meta.env.VITE_OSS_LOAD_BASE_URL}/${res.data}`;
};

const onImageChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const url = await doUpload(file);
    run((c) => c.setImage({ src: url }));
  } catch (err) {
    console.error('图片上传失败:', err);
    ElMessage.error('图片上传失败');
  } finally {
    input.value = '';
  }
};

const onVideoChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const url = await doUpload(file);
    run((c) => c.setVideo({ src: url }));
  } catch (err) {
    console.error('视频上传失败:', err);
    ElMessage.error('视频上传失败');
  } finally {
    input.value = '';
  }
};

const getHTML = () => editor.value?.getHTML() ?? '';
defineExpose({ getHTML });
</script>

<style scoped>
.rich-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.re-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafbfc;
  flex-shrink: 0;
}

.re-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.re-sep {
  width: 1px;
  height: 20px;
  background: #d9d9d9;
  margin: 0 4px;
}

.re-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #595959;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.re-btn:hover:not(:disabled) {
  background: #f0f0f0;
  color: #262626;
}
.re-btn.active {
  background: #e6f4ff;
  color: #1677ff;
  border-color: #91caff;
}
.re-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.re-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.re-btn svg {
  pointer-events: none;
}

.re-select {
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  padding: 0 10px;
  cursor: pointer;
  color: #262626;
  transition: all 0.2s;
  outline: none;
}
.re-select:hover {
  border-color: #4096ff;
}
.re-select:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.re-block-select {
  width: 100px;
}

.re-font-select {
  width: 110px;
}

.re-color-wrapper {
  position: relative;
  display: inline-flex;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.2s;
}
.re-color-wrapper:hover {
  border-color: #4096ff;
}

.re-color-btn {
  position: relative;
  min-width: 32px;
  height: 30px;
  border: none;
  border-radius: 0;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.re-color-btn svg {
  flex-shrink: 0;
}
.re-color-bar {
  width: 14px;
  height: 3px;
  border-radius: 1px;
  transition: all 0.2s;
}

.re-color-picker {
  position: relative;
  width: 24px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-left: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.re-color-picker:hover {
  background: #f5f5f5;
}
.re-color-picker input[type='color'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.re-content {
  flex-grow: 1;
  overflow: auto;
  background: #fff;
}

.re-content::-webkit-scrollbar {
  width: 8px;
}
.re-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}
.re-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}
.re-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 编辑区内容样式 */
.re-content :deep(.ProseMirror) {
  min-height: 100%;
  padding: 20px 24px;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  color: #262626;
}
.re-content :deep(.ProseMirror p) {
  margin: 0 0 12px;
}
.re-content :deep(.ProseMirror h1),
.re-content :deep(.ProseMirror h2),
.re-content :deep(.ProseMirror h3),
.re-content :deep(.ProseMirror h4),
.re-content :deep(.ProseMirror h5),
.re-content :deep(.ProseMirror h6) {
  margin: 24px 0 12px;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a1a;
}
.re-content :deep(.ProseMirror h1) {
  font-size: 32px;
}
.re-content :deep(.ProseMirror h2) {
  font-size: 26px;
}
.re-content :deep(.ProseMirror h3) {
  font-size: 22px;
}
.re-content :deep(.ProseMirror h4) {
  font-size: 18px;
}
.re-content :deep(.ProseMirror h5),
.re-content :deep(.ProseMirror h6) {
  font-size: 16px;
}
.re-content :deep(.ProseMirror img),
.re-content :deep(.ProseMirror video) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.re-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid #1677ff;
  margin: 12px 0;
  padding-left: 16px;
  color: #595959;
  font-style: italic;
}
.re-content :deep(.ProseMirror pre) {
  position: relative;
  background: #f6f8fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 12px 0;
}
.re-content :deep(.re-code-tools) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 0 12px;
  background: #ececec;
  border-bottom: 1px solid #e1e1e1;
  border-radius: 8px 8px 0 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.re-content :deep(.re-code-tools-left),
.re-content :deep(.re-code-tools-right) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.re-content :deep(.re-code-language),
.re-content :deep(.re-code-language-label) {
  max-width: 160px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 30px;
  transition: all 0.2s;
}
.re-content :deep(.re-code-language) {
  padding: 0 26px 0 8px;
  cursor: pointer;
  outline: none;
}
.re-content :deep(.re-code-language:hover),
.re-content :deep(.re-code-language:focus) {
  background: #fff;
  border-color: #d9d9d9;
}
.re-content :deep(.re-code-language-label) {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
}
.re-content :deep(.re-code-copy) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #7a7f86;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}
.re-content :deep(.re-code-copy:hover) {
  background: #fff;
  color: #262626;
  border-color: #d9d9d9;
}
.re-content :deep(.re-code-copy:active) {
  transform: scale(0.96);
}
.re-content :deep(.ProseMirror pre code) {
  display: block;
  background: none;
  padding: 16px;
  font-family: inherit;
}
.re-content :deep(.ProseMirror .tableWrapper) {
  display: inline-block;
  margin: 12px 0;
  border: 1px solid #c4e0ff;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}
.re-content :deep(.ProseMirror.resize-cursor) {
  cursor: col-resize;
}
.re-content :deep(.ProseMirror table) {
  border-collapse: collapse;
  table-layout: fixed;
  border: none;
}
.re-content :deep(.ProseMirror th),
.re-content :deep(.ProseMirror td) {
  border: 1px solid #c9d1d9;
  box-sizing: border-box;
  min-width: 80px;
  height: 40px;
  padding: 8px 12px;
  line-height: 1.5;
  vertical-align: top;
  position: relative;
}
.re-content :deep(.ProseMirror th) {
  background: #f3f6f8;
  font-weight: 600;
  color: #262626;
}
.re-content :deep(.ProseMirror td) {
  background: #ffffff;
}
.re-content :deep(.ProseMirror .column-resize-handle) {
  position: absolute;
  top: 0;
  right: 0;
  bottom: -1px;
  width: 4px;
  background: #1677ff;
  cursor: col-resize;
  pointer-events: none;
}
.re-content :deep(.ProseMirror .selectedCell::after) {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(22, 119, 255, 0.12);
  pointer-events: none;
}
.re-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid #e8e8e8;
  margin: 20px 0;
}
.re-content :deep(.ProseMirror ul),
.re-content :deep(.ProseMirror ol) {
  padding-left: 24px;
  margin: 12px 0;
}
.re-content :deep(.ProseMirror li) {
  margin: 4px 0;
}
.re-content :deep(.ProseMirror code) {
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 0.9em;
  color: #d63384;
}
.re-content :deep(.ProseMirror strong) {
  font-weight: 600;
}
.re-content :deep(.ProseMirror em) {
  font-style: italic;
}
.re-content :deep(.ProseMirror u) {
  text-decoration: underline;
}
.re-content :deep(.ProseMirror s) {
  text-decoration: line-through;
}
</style>
