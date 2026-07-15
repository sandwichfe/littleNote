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
          <button class="re-btn re-color-btn" type="button" title="文字颜色" @click="applyTextColor">
            <svg class="re-text-color-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 3 5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/></svg>
            <span class="re-color-bar" :style="{ backgroundColor: textColor }"></span>
          </button>
          <button
            class="re-color-picker"
            :class="{ active: showColorPalette === 'text' }"
            type="button"
            title="选择文字颜色"
            aria-label="选择文字颜色"
            :aria-expanded="showColorPalette === 'text'"
            @click="toggleColorPalette('text')"
          >
            <svg class="re-color-arrow" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>
          </button>
          <div v-if="showColorPalette === 'text'" class="re-color-palette" @mousedown.prevent>
            <button class="re-color-none" type="button" title="取消文字颜色" @click="clearTextColor">
              <span class="re-color-none-icon" aria-hidden="true"></span>
              <span>无</span>
            </button>
            <div class="re-color-grid" role="grid" aria-label="常用文字颜色">
              <button
                v-for="color in commonColors"
                :key="`text-${color}`"
                class="re-color-swatch"
                :class="{ active: color === textColor }"
                type="button"
                :title="color"
                :style="{ backgroundColor: color }"
                @click="selectTextColor(color)"
              ></button>
            </div>
            <label class="re-color-custom-picker" title="打开调色板" aria-label="打开调色板">
              <span class="re-color-custom-swatch" :style="{ backgroundColor: textColor }"></span>
              <svg class="re-color-custom-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3a9 9 0 0 0 0 18h1.5a1.7 1.7 0 0 0 .9-3.15 1.7 1.7 0 0 1 .9-3.15H17a4 4 0 0 0 4-4C21 6.45 17.15 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <circle cx="7.5" cy="10" r="1.2" fill="currentColor"/>
                <circle cx="10.5" cy="7" r="1.2" fill="currentColor"/>
                <circle cx="14.5" cy="7.5" r="1.2" fill="currentColor"/>
                <circle cx="16.5" cy="11" r="1.2" fill="currentColor"/>
              </svg>
              <input type="color" :value="textColor" @input="onColor" />
            </label>
          </div>
        </div>

        <!-- 背景色 -->
        <div class="re-color-wrapper">
          <button class="re-btn re-color-btn" type="button" title="背景色" @click="applyBgColor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15.5 4.5 4 4-8.25 8.25H7.25l-2.75 2.75-.9-.9 2.75-2.75v-4L15.5 4.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m13.75 6.25 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span class="re-color-bar" :style="{ backgroundColor: backgroundColor }"></span>
          </button>
          <button
            class="re-color-picker"
            :class="{ active: showColorPalette === 'background' }"
            type="button"
            title="选择背景色"
            aria-label="选择背景色"
            :aria-expanded="showColorPalette === 'background'"
            @click="toggleColorPalette('background')"
          >
            <svg class="re-color-arrow" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>
          </button>
          <div v-if="showColorPalette === 'background'" class="re-color-palette" @mousedown.prevent>
            <button class="re-color-none" type="button" title="取消背景色" @click="clearBgColor">
              <span class="re-color-none-icon" aria-hidden="true"></span>
              <span>无</span>
            </button>
            <div class="re-color-grid" role="grid" aria-label="常用背景色">
              <button
                v-for="color in commonColors"
                :key="`background-${color}`"
                class="re-color-swatch"
                :class="{ active: color === backgroundColor }"
                type="button"
                :title="color"
                :style="{ backgroundColor: color }"
                @click="selectBgColor(color)"
              ></button>
            </div>
            <label class="re-color-custom-picker" title="打开调色板" aria-label="打开调色板">
              <span class="re-color-custom-swatch" :style="{ backgroundColor: backgroundColor }"></span>
              <svg class="re-color-custom-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3a9 9 0 0 0 0 18h1.5a1.7 1.7 0 0 0 .9-3.15 1.7 1.7 0 0 1 .9-3.15H17a4 4 0 0 0 4-4C21 6.45 17.15 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <circle cx="7.5" cy="10" r="1.2" fill="currentColor"/>
                <circle cx="10.5" cy="7" r="1.2" fill="currentColor"/>
                <circle cx="14.5" cy="7.5" r="1.2" fill="currentColor"/>
                <circle cx="16.5" cy="11" r="1.2" fill="currentColor"/>
              </svg>
              <input type="color" :value="backgroundColor" @input="onBg" />
            </label>
          </div>
        </div>

        <span class="re-sep"></span>

        <!-- 列表 -->
        <button class="re-btn" :class="{ active: editor.isActive('bulletList') }"
                @click="toggleListKeepingBlockStyle('bulletList')" title="无序列表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </button>
        <button class="re-btn" :class="{ active: editor.isActive('orderedList') }"
                @click="toggleListKeepingBlockStyle('orderedList')" title="有序列表">
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
                @click="toggleCodeBlock" title="代码块">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </button>
        <button class="re-btn" @click="pickImage" title="插入图片">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
        <button class="re-btn" @click="pickVideo" title="插入视频">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
        </button>
        <div
          class="re-table-insert"
          :title="isSelectionInTable ? '单元格内不能插入表格' : '插入表格'"
          @mouseleave="resetTablePickerPreview"
        >
          <button
            class="re-btn"
            :class="{ active: showTablePicker && !isSelectionInTable }"
            type="button"
            :disabled="isSelectionInTable"
            :aria-disabled="isSelectionInTable"
            @click="toggleTablePicker"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/></svg>
          </button>
          <div v-if="showTablePicker" class="re-table-picker" @mousedown.prevent>
            <div
              class="re-table-picker-grid"
              :style="{
                gridTemplateColumns: `repeat(${TABLE_PICKER_COLS}, 18px)`,
                gridTemplateRows: `repeat(${TABLE_PICKER_ROWS}, 18px)`,
              }"
            >
              <button
                v-for="cell in tablePickerCells"
                :key="`${cell.row}-${cell.col}`"
                class="re-table-picker-cell"
                :class="{ active: cell.row <= tablePickerRows && cell.col <= tablePickerCols }"
                type="button"
                @mouseenter="previewTableSize(cell.row, cell.col)"
                @click="insertTable(cell.row, cell.col)"
              ></button>
            </div>
            <div class="re-table-picker-size">{{ tablePickerRows }} x {{ tablePickerCols }}</div>
          </div>
        </div>
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

    <div class="re-editor-shell">
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
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
import { common, createLowlight } from 'lowlight';
import { ElMessage } from 'element-plus';
import { uploadImage } from '@/network/file';
import {
  blockTypes,
  commonColors,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_IMAGE_SCALE,
  DEFAULT_TEXT_COLOR,
  fonts,
  TABLE_PICKER_COLS,
  TABLE_PICKER_DEFAULT_COLS,
  TABLE_PICKER_DEFAULT_ROWS,
  TABLE_PICKER_ROWS,
  TABLE_TOOLBAR_FALLBACK_WIDTH,
  TABLE_TOOLBAR_OFFSET,
} from './config';
import { CodeBlockWithTools } from './extensions/CodeBlockWithTools';
import { ImageWithSize } from './extensions/ImageWithSize';
import { ListItemWithHeading, TableWithResizableColumns } from './extensions/basicExtensions';
import { getSelectionDeleteLineRange } from './utils/deleteLine';
import { Video } from './VideoNode';
import 'highlight.js/styles/atom-one-light.css';

const props = withDefaults(defineProps<{ modelValue: string; editable?: boolean }>(), {
  modelValue: '',
  editable: true,
});
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const lowlight = createLowlight(common);

const rootRef = ref<HTMLElement>();
const imageInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();
const tableToolbarRef = ref<HTMLElement>();
const currentBlock = ref('paragraph');
const currentFont = ref('');
const textColor = ref(DEFAULT_TEXT_COLOR);
const backgroundColor = ref(DEFAULT_BACKGROUND_COLOR);
const showColorPalette = ref<'text' | 'background' | null>(null);
const showTablePicker = ref(false);
const isSelectionInTable = ref(false);
const tablePickerRows = ref(6);
const tablePickerCols = ref(6);
const tableToolbar = reactive({
  visible: false,
  top: 0,
  left: 0,
});

const tablePickerCells = computed(() =>
  Array.from({ length: TABLE_PICKER_ROWS * TABLE_PICKER_COLS }, (_, index) => ({
    row: Math.floor(index / TABLE_PICKER_COLS) + 1,
    col: (index % TABLE_PICKER_COLS) + 1,
  }))
);

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);


const syncToolbarState = (targetEditor?: any) => {
  if (!targetEditor) return;

  const heading = blockTypes.find((item) => {
    if (item.value === 'paragraph') return false;
    return targetEditor.isActive('heading', { level: Number(item.value.replace('heading-', '')) });
  });
  currentBlock.value = heading?.value ?? 'paragraph';

  currentFont.value = targetEditor.getAttributes('textStyle').fontFamily || '';

  isSelectionInTable.value = targetEditor.isActive('table');
  if (isSelectionInTable.value) {
    showTablePicker.value = false;
    showColorPalette.value = null;
    tablePickerRows.value = TABLE_PICKER_DEFAULT_ROWS;
    tablePickerCols.value = TABLE_PICKER_DEFAULT_COLS;
  }
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

const updateTableToolbarPosition = () => {
  if (!props.editable || !editor.value) {
    hideTableToolbar();
    return;
  }

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
};

const closeTablePicker = () => {
  showTablePicker.value = false;
  resetTablePickerPreview();
};

const closeColorPalette = () => {
  showColorPalette.value = null;
};

const onDocumentMouseDown = (event: MouseEvent) => {
  const target = event.target as globalThis.Node;
  if (showTablePicker.value) {
    const tableInsert = rootRef.value?.querySelector('.re-table-insert');
    if (!tableInsert?.contains(target)) closeTablePicker();
  }

  if (showColorPalette.value) {
    const colorWrapper = (target as Element | null)?.closest?.('.re-color-wrapper');
    if (!colorWrapper || !rootRef.value?.contains(colorWrapper)) closeColorPalette();
  }
};

const onDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeTablePicker();
    closeColorPalette();
  }
};

const getImageFileFromClipboard = (event: ClipboardEvent) => {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'));

  return imageItem?.getAsFile() || null;
};

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({ codeBlock: false, listItem: false }),
    ListItemWithHeading,
    TextStyle,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    Underline,
    Strike,
    Italic,
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
    updateTableToolbarPosition();
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
    syncToolbarState(editor);
    updateTableToolbarPosition();
  },
  onSelectionUpdate: ({ editor }) => {
    syncToolbarState(editor);
    updateTableToolbarPosition();
  },
  editorProps: {
    handlePaste: (view, event) => {
      const imageFile = getImageFileFromClipboard(event);
      if (!imageFile) return false;

      event.preventDefault();
      void insertUploadedImage(imageFile, view.state.selection.from);
      return true;
    },
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

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown);
  document.addEventListener('keydown', onDocumentKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown);
  document.removeEventListener('keydown', onDocumentKeyDown);
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

const getActiveHeadingLevel = () => {
  if (!editor.value) return null;

  for (const item of blockTypes) {
    if (item.value === 'paragraph') continue;

    const level = Number(item.value.replace('heading-', ''));
    if (editor.value.isActive('heading', { level })) return level;
  }

  return null;
};

const toggleListKeepingBlockStyle = (listType: 'bulletList' | 'orderedList') => {
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
    chain.setHeading({ level: headingLevel });
  }

  chain.run();
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

const toggleColorPalette = (type: 'text' | 'background') => {
  showColorPalette.value = showColorPalette.value === type ? null : type;
  closeTablePicker();
};

const applyTextColor = () => run((c) => c.setColor(textColor.value));
const selectTextColor = (color: string) => {
  if (!isHexColor(color)) return;
  textColor.value = color;
  applyTextColor();
  closeColorPalette();
};

const onColor = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  if (!isHexColor(val)) return;
  textColor.value = val;
  applyTextColor();
};

const clearTextColor = () => {
  textColor.value = DEFAULT_TEXT_COLOR;
  run((c) => c.unsetColor());
  closeColorPalette();
};

const applyBgColor = () => run((c) => c.setHighlight({ color: backgroundColor.value }));
const selectBgColor = (color: string) => {
  if (!isHexColor(color)) return;
  backgroundColor.value = color;
  applyBgColor();
  closeColorPalette();
};

const onBg = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  if (!isHexColor(val)) return;
  backgroundColor.value = val;
  applyBgColor();
};

const clearBgColor = () => {
  backgroundColor.value = DEFAULT_BACKGROUND_COLOR;
  run((c) => c.unsetHighlight());
  closeColorPalette();
};

const toggleTablePicker = () => {
  showTablePicker.value = !showTablePicker.value;
  closeColorPalette();
  resetTablePickerPreview();
};

const resetTablePickerPreview = () => {
  tablePickerRows.value = TABLE_PICKER_DEFAULT_ROWS;
  tablePickerCols.value = TABLE_PICKER_DEFAULT_COLS;
};

const previewTableSize = (rows: number, cols: number) => {
  tablePickerRows.value = rows;
  tablePickerCols.value = cols;
};

const insertTable = (rows = TABLE_PICKER_DEFAULT_ROWS, cols = TABLE_PICKER_DEFAULT_COLS) => {
  showTablePicker.value = false;
  resetTablePickerPreview();
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

const pickImage = () => imageInput.value?.click();
const pickVideo = () => videoInput.value?.click();

const doUpload = async (file: File) => {
  const res = await uploadImage(file);
  return `${import.meta.env.VITE_OSS_LOAD_BASE_URL}/${res.data}`;
};

const insertUploadedImage = async (file: File, position?: number) => {
  try {
    const url = await doUpload(file);
    const chain = editor.value?.chain().focus();
    if (!chain) return;

    const imageContent = [
      { type: 'image', attrs: { src: url, scale: DEFAULT_IMAGE_SCALE } },
      { type: 'text', text: ' ' },
    ];

    if (typeof position === 'number') {
      chain.insertContentAt(position, imageContent).run();
    } else {
      chain.insertContent(imageContent).run();
    }
  } catch (err) {
    console.error('图片上传失败:', err);
    ElMessage.error('图片上传失败');
  }
};

const onImageChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await insertUploadedImage(file);
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
