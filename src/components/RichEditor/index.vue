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
                @click="run(c => c.toggleCodeBlock())" title="代码块">
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
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import ListItem from '@tiptap/extension-list-item';
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
const tableToolbarRef = ref<HTMLElement>();
const currentBlock = ref('paragraph');
const currentFont = ref('');
const DEFAULT_TEXT_COLOR = '#000000';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const commonColors = [
  '#ff0000',
  '#eded0f',
  '#00b050',
  '#00b0f0',
  '#7030a0',
  '#0000ff',
  '#000000',
  '#843c0c',
  '#808080',
  '#d9ead3',
  '#d9d9d9',
  '#ffffff',
];
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

const DEFAULT_IMAGE_SCALE = '100%';
const MIN_IMAGE_SCALE_PERCENT = 10;
const MAX_IMAGE_SCALE_PERCENT = 300;
const TABLE_PICKER_ROWS = 8;
const TABLE_PICKER_COLS = 10;
const TABLE_PICKER_DEFAULT_ROWS = 6;
const TABLE_PICKER_DEFAULT_COLS = 6;
const TABLE_TOOLBAR_FALLBACK_WIDTH = 322;
const TABLE_TOOLBAR_OFFSET = 8;

const tablePickerCells = computed(() =>
  Array.from({ length: TABLE_PICKER_ROWS * TABLE_PICKER_COLS }, (_, index) => ({
    row: Math.floor(index / TABLE_PICKER_COLS) + 1,
    col: (index % TABLE_PICKER_COLS) + 1,
  }))
);

const imageToolbarOptions = [
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
  { label: '125%', value: '125%' },
  { label: '150%', value: '150%' },
  { label: '175%', value: '175%' },
  { label: '200%', value: '200%' },
];

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const normalizeImageWidth = (value: unknown) => {
  if (typeof value !== 'string') return null;

  const width = value.trim();
  if (!width) return null;
  if (/^\d+(\.\d+)?$/.test(width)) return `${width}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|vw|vh)$/i.test(width)) return width;

  return null;
};

const normalizeImageScale = (value: unknown) => {
  if (typeof value !== 'string') return null;

  const scale = value.trim();
  if (!scale) return null;
  if (/^\d+(\.\d+)?$/.test(scale)) return `${scale}%`;
  if (/^\d+(\.\d+)?%$/.test(scale)) return scale;

  return null;
};

const getImageNaturalWidth = (image: HTMLImageElement) =>
  image.naturalWidth || Number.parseFloat(image.getAttribute('width') || '') || image.offsetWidth;

const getImageScalePercent = (scale: string | null, image: HTMLImageElement, wrapper: HTMLElement) => {
  if (scale?.endsWith('%')) return Number.parseFloat(scale);

  const naturalWidth = getImageNaturalWidth(image);
  if (!naturalWidth) return Number.parseFloat(DEFAULT_IMAGE_SCALE);

  return Math.round((wrapper.offsetWidth / naturalWidth) * 100);
};

const createImageView = ({ node, view, getPos, editor }: NodeViewRendererProps) => {
  let currentNode = node;
  let resizeFrame = 0;
  let pendingResizeScale: string | null = null;
  let cleanupResizeListeners: (() => void) | null = null;

  const wrapper = document.createElement('span');
  wrapper.className = 're-image-node';
  wrapper.contentEditable = 'false';

  const image = document.createElement('img');
  image.draggable = true;

  const stage = document.createElement('span');
  stage.className = 're-image-stage';

  const controls = document.createElement('span');
  controls.className = 're-image-controls';

  const sizeLabel = document.createElement('span');
  sizeLabel.className = 're-image-size-label';
  sizeLabel.textContent = '尺寸';

  const sizeSelect = document.createElement('select');
  sizeSelect.className = 're-image-size-select';
  sizeSelect.title = '图片尺寸';
  imageToolbarOptions.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    sizeSelect.appendChild(option);
  });
  const customSizeOption = document.createElement('option');
  customSizeOption.hidden = true;
  sizeSelect.appendChild(customSizeOption);
  sizeSelect.addEventListener('change', () => {
    updateScale(sizeSelect.value);
    view.focus();
  });

  const keepControlsFromSelectingEditor = (event: MouseEvent | PointerEvent) => {
    if (sizeSelect.contains(event.target as globalThis.Node)) {
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  };
  controls.addEventListener('pointerdown', keepControlsFromSelectingEditor);
  controls.addEventListener('mousedown', keepControlsFromSelectingEditor);

  controls.append(sizeLabel, sizeSelect);

  const handle = document.createElement('span');
  handle.className = 're-image-resize-handle';
  handle.title = '拖拽调整图片大小';
  stage.append(image, handle);
  wrapper.append(stage, controls);

  const updateScaleControls = (scale: string | null) => {
    const hasPresetScale = imageToolbarOptions.some((item) => item.value === scale);
    if (scale && hasPresetScale) {
      sizeSelect.value = scale;
      customSizeOption.value = '';
      customSizeOption.textContent = '';
    } else if (scale) {
      customSizeOption.value = scale;
      customSizeOption.textContent = scale;
      sizeSelect.value = scale;
    }
    sizeSelect.classList.toggle('has-custom-size', Boolean(scale && !hasPresetScale));
  };

  const updateImage = () => {
    const width = normalizeImageWidth(currentNode.attrs.width);
    const scale = normalizeImageScale(currentNode.attrs.scale) || normalizeImageScale(width) || DEFAULT_IMAGE_SCALE;
    image.src = currentNode.attrs.src;
    image.alt = currentNode.attrs.alt || '';
    image.title = currentNode.attrs.title || '';
    image.onload = () => applyImageScale(scale, width);
    applyImageScale(scale, width);
    updateScaleControls(scale);
  };

  function applyImageScale(scale: string | null, fallbackWidth?: string | null) {
    const normalizedScale = normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE;
    const naturalWidth = getImageNaturalWidth(image);

    if (!naturalWidth) {
      if (fallbackWidth) wrapper.style.width = fallbackWidth;
      return;
    }

    const scalePercent = Number.parseFloat(normalizedScale);
    const width = `${Math.round((naturalWidth * scalePercent) / 100)}px`;
    wrapper.style.width = width;
    wrapper.dataset.scale = normalizedScale;
  }

  function previewScale(scale: string | null) {
    const normalizedScale = normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE;

    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    pendingResizeScale = normalizedScale;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      applyImageScale(pendingResizeScale);
      updateScaleControls(pendingResizeScale);
      wrapper.dataset.resizeLabel = pendingResizeScale || '';
    });
  }

  function updateScale(scale: string | null) {
    const pos = getPos();
    if (typeof pos !== 'number') return;

    const normalizedScale = normalizeImageScale(scale) || DEFAULT_IMAGE_SCALE;
    const current = view.state.doc.nodeAt(pos);
    if (!current) return;

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...current.attrs,
        scale: normalizedScale,
        width: null,
      })
    );
  }

  handle.addEventListener('pointerdown', (event) => {
    if (!editor.isEditable) return;

    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture?.(event.pointerId);
    wrapper.classList.add('resizing');

    const startX = event.clientX;
    const naturalWidth = getImageNaturalWidth(image) || 1;
    const startPercent =
      getImageScalePercent(normalizeImageScale(currentNode.attrs.scale), image, wrapper) ||
      Number.parseFloat(DEFAULT_IMAGE_SCALE);
    let lastPercent = startPercent;
    let finalPercent = startPercent;
    wrapper.dataset.resizeLabel = `${startPercent}%`;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPercent = ((moveEvent.clientX - startX) / naturalWidth) * 100;
      const nextPercent = Math.max(
        MIN_IMAGE_SCALE_PERCENT,
        Math.min(MAX_IMAGE_SCALE_PERCENT, Math.round(startPercent + deltaPercent))
      );

      if (nextPercent === lastPercent) return;
      lastPercent = nextPercent;
      finalPercent = nextPercent;
      previewScale(`${nextPercent}%`);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cleanupResizeListeners?.();
      cleanupResizeListeners = null;
      handle.releasePointerCapture?.(upEvent.pointerId);
      wrapper.classList.remove('resizing');
      delete wrapper.dataset.resizeLabel;
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = 0;
      }
      if (finalPercent !== startPercent) {
        updateScale(`${finalPercent}%`);
      }
      view.focus();
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    cleanupResizeListeners = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  });

  updateImage();

  return {
    dom: wrapper,
    update: (updatedNode) => {
      if (updatedNode.type !== currentNode.type) return false;
      currentNode = updatedNode;
      updateImage();
      return true;
    },
    selectNode: () => wrapper.classList.add('selected'),
    deselectNode: () => wrapper.classList.remove('selected'),
    stopEvent: (event: Event) =>
      controls.contains(event.target as globalThis.Node) ||
      handle.contains(event.target as globalThis.Node),
    ignoreMutation: () => true,
    destroy: () => {
      cleanupResizeListeners?.();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
    },
  };
};

const ImageWithSize = Image.extend({
  addAttributes() {
    const parentAttributes = this.parent?.() ?? {};

    return {
      ...parentAttributes,
      width: {
        default: null,
        parseHTML: (element) =>
          normalizeImageWidth(element.style.width || element.getAttribute('width')),
        renderHTML: (attributes) => {
          if (normalizeImageScale(attributes.scale)) return {};

          const width = normalizeImageWidth(attributes.width);
          if (!width) return {};

          return {
            'data-width': width,
            style: `width: ${width};`,
          };
        },
      },
      scale: {
        default: null,
        parseHTML: (element) =>
          normalizeImageScale(element.getAttribute('data-scale')) ||
          normalizeImageScale(element.getAttribute('scale')),
        renderHTML: (attributes) => {
          const scale = normalizeImageScale(attributes.scale) || DEFAULT_IMAGE_SCALE;

          return {
            'data-scale': scale,
          };
        },
      },
    };
  },
  addNodeView() {
    return createImageView;
  },
});

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

const ListItemWithHeading = ListItem.extend({
  content: '(paragraph | heading) block*',
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
  align-items: stretch;
  height: 32px;
  border-radius: 6px;
  overflow: visible;
  background: transparent;
  transition: background 0.16s, box-shadow 0.16s;
}
.re-color-wrapper:hover {
  background: #f0f0f0;
}
.re-color-wrapper:focus-within {
  background: #eef6ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.08);
}

.re-color-btn {
  position: relative;
  width: 34px;
  min-width: 34px;
  height: 32px;
  border: none;
  border-radius: 0;
  padding: 3px 6px 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.re-color-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.04);
}
.re-color-btn svg {
  flex-shrink: 0;
}
.re-text-color-icon {
  transform: translateY(3px);
}
.re-color-bar {
  width: 19px;
  height: 4px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 2px;
  box-sizing: border-box;
  transition: border-color 0.16s, background-color 0.16s;
}

.re-color-picker {
  width: 16px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #7a7f86;
  transition: background 0.16s, color 0.16s;
}
.re-color-picker:hover,
.re-color-picker.active {
  background: rgba(0, 0, 0, 0.04);
  color: #1677ff;
}
.re-color-picker:focus-visible {
  outline: none;
  background: rgba(22, 119, 255, 0.08);
  color: #1677ff;
}
.re-color-arrow {
  pointer-events: none;
  flex-shrink: 0;
}

.re-color-palette {
  position: absolute;
  top: 36px;
  left: 0;
  width: 138px;
  padding: 8px;
  border: 1px solid #d9dfe8;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
  z-index: 25;
}

.re-color-none,
.re-color-custom-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 30px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #262626;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s, color 0.16s;
}

.re-color-none:hover,
.re-color-custom-picker:hover {
  border-color: #d7e8ff;
  background: #eef6ff;
  color: #1677ff;
}

.re-color-none-icon {
  position: relative;
  width: 16px;
  height: 16px;
  border: 1px solid #b8c1cc;
  background: #fff;
  flex-shrink: 0;
}

.re-color-none-icon::after {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  top: 7px;
  height: 2px;
  background: #86878d;
  transform: rotate(-45deg);
  transform-origin: center;
}

.re-color-grid {
  display: grid;
  grid-template-columns: repeat(6, 16px);
  gap: 5px;
  padding: 8px 4px;
}

.re-color-swatch {
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 2px;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s, transform 0.12s;
}

.re-color-swatch:hover,
.re-color-swatch.active {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18);
}

.re-color-swatch:active {
  transform: scale(0.92);
}

.re-color-custom-picker {
  position: relative;
  justify-content: center;
  overflow: hidden;
}

.re-color-custom-swatch {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.re-color-custom-icon {
  color: #5f6b7a;
  flex-shrink: 0;
}

.re-color-custom-picker input[type='color'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.re-table-insert {
  position: relative;
  display: inline-flex;
}

.re-table-picker {
  position: absolute;
  top: 36px;
  left: 0;
  width: max-content;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
  z-index: 20;
}

.re-table-picker-grid {
  display: grid;
  gap: 1px;
  padding: 1px;
  background: #e5e7eb;
}

.re-table-picker-cell {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: #fff;
  cursor: pointer;
  transition: background 0.12s, box-shadow 0.12s;
}

.re-table-picker-cell.active {
  background: #e8f3ff;
  box-shadow: inset 0 0 0 1px #1677ff;
}

.re-table-picker-size {
  height: 24px;
  color: #374151;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  margin-top: 8px;
}

.re-editor-shell {
  position: relative;
  flex-grow: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.re-table-toolbar {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: max-content;
  min-height: 38px;
  padding: 4px;
  border: 1px solid #d9dfe8;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  z-index: 15;
}

.re-table-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s, color 0.16s;
}

.re-table-tool:hover {
  border-color: #d7e8ff;
  background: #eef6ff;
  color: #1677ff;
}

.re-table-tool.danger:hover {
  border-color: #ffd8d8;
  background: #fff1f0;
  color: #d9363e;
}

.re-table-tool-sep {
  width: 1px;
  height: 22px;
  background: #e5e7eb;
  margin: 0 2px;
}

.re-content {
  flex-grow: 1;
  overflow: auto;
  background: #fff;
  min-height: 0;
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
.re-content :deep(.ProseMirror .re-image-node) {
  position: relative;
  display: inline-block;
  vertical-align: bottom;
  max-width: 100%;
  margin: 4px 12px 0 0;
  line-height: 0;
}
.re-content :deep(.ProseMirror .re-image-stage) {
  position: relative;
  display: block;
  width: 100%;
  line-height: 0;
}
.re-content :deep(.ProseMirror .re-image-node img) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.re-content :deep(.ProseMirror .re-image-node:not([data-scale]) img) {
  width: auto;
  max-width: 100%;
}
.re-content :deep(.ProseMirror .re-image-node.selected img) {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}
.re-content :deep(.ProseMirror .re-image-node.resizing img) {
  outline-color: #0958d9;
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.2);
}
.re-content :deep(.ProseMirror .re-image-controls) {
  position: absolute;
  left: 50%;
  top: -42px;
  display: none;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 4px 6px;
  border: 1px solid rgba(22, 119, 255, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(8px);
  transform: translateX(-50%);
  line-height: 1;
  white-space: nowrap;
  z-index: 4;
}
.re-content :deep(.ProseMirror .re-image-node.selected .re-image-controls) {
  display: inline-flex;
}
.re-content :deep(.ProseMirror .re-image-size-label) {
  padding: 0 2px 0 4px;
  color: #595959;
  font-size: 12px;
  line-height: 24px;
}
.re-content :deep(.ProseMirror .re-image-size-select) {
  height: 26px;
  min-width: 76px;
  padding: 0 24px 0 9px;
  border: 1px solid #d9e8ff;
  border-radius: 6px;
  background:
    linear-gradient(45deg, transparent 50%, #4b5563 50%) right 10px center / 5px 5px no-repeat,
    linear-gradient(135deg, #4b5563 50%, transparent 50%) right 6px center / 5px 5px no-repeat,
    #f8fbff;
  color: #1f2937;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}
.re-content :deep(.ProseMirror .re-image-size-select:hover) {
  border-color: #69b1ff;
  background-color: #fff;
}
.re-content :deep(.ProseMirror .re-image-size-select:focus) {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}
.re-content :deep(.ProseMirror .re-image-size-select.has-custom-size) {
  color: #1677ff;
  border-color: #91caff;
}
.re-content :deep(.ProseMirror .re-image-control-btn) {
  height: 30px;
  min-width: 52px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: #262626;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}
.re-content :deep(.ProseMirror .re-image-control-btn:hover),
.re-content :deep(.ProseMirror .re-image-control-btn.active) {
  color: #1677ff;
  background: #f0f7ff;
}
.re-content :deep(.ProseMirror .re-image-resize-handle) {
  position: absolute;
  right: -12px;
  bottom: -12px;
  display: none;
  width: 24px;
  height: 24px;
  border: 0;
  background: transparent;
  box-sizing: border-box;
  cursor: nwse-resize;
  touch-action: none;
  z-index: 3;
}
.re-content :deep(.ProseMirror .re-image-resize-handle::before) {
  content: '';
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 12px;
  height: 12px;
  border-right: 2px solid #8c8c8c;
  border-bottom: 2px solid #8c8c8c;
  border-radius: 0 0 2px 0;
  pointer-events: none;
  transition: border-color 0.18s ease;
}
.re-content :deep(.ProseMirror .re-image-node.selected .re-image-resize-handle) {
  display: block;
}
.re-content :deep(.ProseMirror .re-image-node.selected .re-image-resize-handle:hover::before),
.re-content :deep(.ProseMirror .re-image-node.resizing .re-image-resize-handle::before) {
  border-color: #1677ff;
}
.re-content :deep(.ProseMirror .re-image-node.resizing::after) {
  content: attr(data-resize-label);
  position: absolute;
  right: 0;
  bottom: -32px;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  pointer-events: none;
  z-index: 4;
}
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
  position: relative;
  display: inline-block;
  margin: 12px 0;
  border: 1px solid #c4e0ff;
  border-radius: 6px;
  overflow: visible;
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
.re-content :deep(.ProseMirror li > h1),
.re-content :deep(.ProseMirror li > h2),
.re-content :deep(.ProseMirror li > h3),
.re-content :deep(.ProseMirror li > h4),
.re-content :deep(.ProseMirror li > h5),
.re-content :deep(.ProseMirror li > h6) {
  margin: 24px 0 12px;
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
