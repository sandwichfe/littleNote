<template>
  <div class="rich-editor">
    <div v-if="editable && editor" class="re-toolbar">
      <!-- 字体 -->
      <select class="re-select" :value="currentFont" @change="onFontChange">
        <option value="">默认字体</option>
        <option v-for="f in fonts" :key="f.value" :value="f.value" :style="{ fontFamily: f.value }">
          {{ f.label }}
        </option>
      </select>

      <span class="re-sep"></span>

      <!-- 文字颜色 -->
      <label class="re-color" title="文字颜色">
        <span class="re-color-ico" style="border-bottom: 3px solid currentColor">A</span>
        <input type="color" :value="currentColor" @input="onColor" />
      </label>
      <!-- 背景色 -->
      <label class="re-color" title="背景色">
        <span class="re-color-ico re-bg-ico">A</span>
        <input type="color" :value="currentBg" @input="onBg" />
      </label>

      <span class="re-sep"></span>

      <!-- 加粗 -->
      <button class="re-btn re-bold" :class="{ active: editor.isActive('bold') }"
              @click="run(c => c.toggleBold())" title="加粗">B</button>

      <span class="re-sep"></span>

      <!-- 列表 -->
      <button class="re-btn" :class="{ active: editor.isActive('orderedList') }"
              @click="run(c => c.toggleOrderedList())" title="有序列表">1.</button>
      <button class="re-btn" :class="{ active: editor.isActive('bulletList') }"
              @click="run(c => c.toggleBulletList())" title="无序列表">•</button>

      <span class="re-sep"></span>

      <!-- 对齐 -->
      <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }"
              @click="run(c => c.setTextAlign('left'))" title="左对齐">⬅</button>
      <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }"
              @click="run(c => c.setTextAlign('center'))" title="居中">⬌</button>
      <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }"
              @click="run(c => c.setTextAlign('right'))" title="右对齐">➡</button>
      <button class="re-btn" :class="{ active: editor.isActive({ textAlign: 'justify' }) }"
              @click="run(c => c.setTextAlign('justify'))" title="两端对齐">☰</button>

      <span class="re-sep"></span>

      <!-- 代码块 / 表格 / 分割线 -->
      <button class="re-btn" :class="{ active: editor.isActive('codeBlock') }"
              @click="run(c => c.toggleCodeBlock())" title="代码块">&lt;/&gt;</button>
      <button class="re-btn" @click="insertTable" title="插入表格">表格</button>
      <button class="re-btn" @click="run(c => c.setHorizontalRule())" title="分割线">―</button>

      <span class="re-sep"></span>

      <!-- 图片 / 视频 -->
      <button class="re-btn" @click="pickImage" title="上传图片">图片</button>
      <button class="re-btn" @click="pickVideo" title="上传视频">视频</button>

      <span class="re-sep"></span>

      <!-- 撤销 / 重做 -->
      <button class="re-btn" :disabled="!editor.can().undo()"
              @click="run(c => c.undo())" title="撤销">↶</button>
      <button class="re-btn" :disabled="!editor.can().redo()"
              @click="run(c => c.redo())" title="重做">↷</button>

      <input ref="imageInput" type="file" accept="image/*" hidden @change="onImageChange" />
      <input ref="videoInput" type="file" accept="video/*" hidden @change="onVideoChange" />
    </div>

    <editor-content :editor="editor" class="re-content" />
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
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
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

const imageInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();

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
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ inline: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({ lowlight }),
    Video,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
});

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val || '', false);
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

const run = (fn: (chain: any) => any) => {
  if (!editor.value) return;
  fn(editor.value.chain().focus()).run();
};

const currentFont = ref('');
const currentColor = ref('#000000');
const currentBg = ref('#ffff00');

const onFontChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  currentFont.value = val;
  if (val) run((c) => c.setFontFamily(val));
  else run((c) => c.unsetFontFamily());
};
const onColor = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  currentColor.value = val;
  run((c) => c.setColor(val));
};
const onBg = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  currentBg.value = val;
  run((c) => c.setHighlight({ color: val }));
};

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
}

.re-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid #ccc;
  background: #fafafa;
  flex-shrink: 0;
}

.re-sep {
  width: 1px;
  height: 18px;
  background: #e0e0e0;
  margin: 0 2px;
}

.re-btn {
  min-width: 30px;
  height: 28px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #444;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
}
.re-btn:hover:not(:disabled) {
  background: #eef0f2;
}
.re-btn.active {
  background: #e3f0ff;
  color: #1677ff;
  border-color: #bcdcff;
}
.re-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.re-bold {
  font-weight: 700;
}

.re-select {
  height: 28px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  padding: 0 6px;
  cursor: pointer;
  color: #444;
}

.re-color {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
}
.re-color:hover {
  background: #eef0f2;
}
.re-color-ico {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  pointer-events: none;
}
.re-bg-ico {
  background: #ffe58f;
  padding: 0 2px;
  border-radius: 2px;
}
.re-color input[type='color'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.re-content {
  flex-grow: 1;
  overflow-y: auto;
}

/* 编辑区内容样式 */
.re-content :deep(.ProseMirror) {
  min-height: 100%;
  padding: 12px 16px;
  outline: none;
}
.re-content :deep(.ProseMirror p) {
  margin: 0 0 8px;
}
.re-content :deep(.ProseMirror img),
.re-content :deep(.ProseMirror video) {
  max-width: 100%;
  height: auto;
}
.re-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid #ddd;
  margin: 8px 0;
  padding-left: 12px;
  color: #666;
}
.re-content :deep(.ProseMirror pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
}
.re-content :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
}
.re-content :deep(.ProseMirror table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  table-layout: fixed;
}
.re-content :deep(.ProseMirror th),
.re-content :deep(.ProseMirror td) {
  border: 1px solid #ccc;
  padding: 6px 8px;
  vertical-align: top;
}
.re-content :deep(.ProseMirror th) {
  background: #f5f7fa;
  font-weight: 600;
}
.re-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 12px 0;
}
</style>
