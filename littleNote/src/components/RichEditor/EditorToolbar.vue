<template>
  <div ref="toolbarRef" class="re-toolbar">
    <div class="re-toolbar-row">
      <!-- 正文 / 标题 -->
      <select class="re-select re-block-select" :value="blockType" @change="onBlockChange">
        <option v-for="item in blockTypes" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>

      <!-- 字体 -->
      <select class="re-select re-font-select" :value="font" @change="onFontChange">
        <option value="">默认</option>
        <option v-for="f in fonts" :key="f.value" :value="f.value" :style="{ fontFamily: f.value }">
          {{ f.label }}
        </option>
      </select>

      <span class="re-sep"></span>

      <!-- 加粗 / 斜体 / 下划线 -->
      <button class="re-btn" :class="{ active: active.bold }" @click="emit('run-command', 'bold')"
              title="加粗 (Ctrl+B)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.italic }" @click="emit('run-command', 'italic')"
              title="斜体 (Ctrl+I)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.underline }" @click="emit('run-command', 'underline')"
              title="下划线 (Ctrl+U)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.strike }" @click="emit('run-command', 'strike')"
              title="删除线">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.code }" @click="emit('run-command', 'code')"
              title="行内代码">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6M15 6l6 6-6 6"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.link }" @click="emit('open-link')" title="链接">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round"><path d="M10.6 13.4a4 4 0 0 0 5.66 0l2.12-2.12a4 4 0 0 0-5.66-5.66l-1.06 1.06"/><path d="M13.4 10.6a4 4 0 0 0-5.66 0l-2.12 2.12a4 4 0 0 0 5.66 5.66l1.06-1.06"/></svg>
      </button>
      <button class="re-btn" @click="emit('run-command', 'clearFormat')" title="清除格式">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="m14 4 6 6-8 8H6l-2-2z"/><path d="m12 6 6 6"/></svg>
      </button>

      <span class="re-sep"></span>

      <!-- 文字颜色 -->
      <div class="re-color-wrapper">
        <button class="re-btn re-color-btn" type="button" title="文字颜色"
                @click="emit('set-color', { type: 'text', color: textColor })">
          <svg class="re-text-color-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 3 5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/></svg>
          <span class="re-color-bar" :style="{ backgroundColor: textColor }"></span>
        </button>
        <button
          class="re-color-picker"
          :class="{ active: colorPalette === 'text' }"
          type="button"
          title="选择文字颜色"
          aria-label="选择文字颜色"
          :aria-expanded="colorPalette === 'text'"
          @click="emit('toggle-color-palette', 'text')"
        >
          <svg class="re-color-arrow" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>
        </button>
        <div v-if="colorPalette === 'text'" class="re-color-palette" @mousedown.prevent>
          <button class="re-color-none" type="button" title="取消文字颜色"
                  @click="emit('set-color', { type: 'text', color: null, close: true })">
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
              @click="emit('set-color', { type: 'text', color, close: true })"
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
            <input type="color" :value="textColor" @input="onTextColorInput" />
          </label>
        </div>
      </div>

      <!-- 背景色 -->
      <div class="re-color-wrapper">
        <button class="re-btn re-color-btn" type="button" title="背景色"
                @click="emit('set-color', { type: 'background', color: backgroundColor })">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15.5 4.5 4 4-8.25 8.25H7.25l-2.75 2.75-.9-.9 2.75-2.75v-4L15.5 4.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m13.75 6.25 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span class="re-color-bar" :style="{ backgroundColor }"></span>
        </button>
        <button
          class="re-color-picker"
          :class="{ active: colorPalette === 'background' }"
          type="button"
          title="选择背景色"
          aria-label="选择背景色"
          :aria-expanded="colorPalette === 'background'"
          @click="emit('toggle-color-palette', 'background')"
        >
          <svg class="re-color-arrow" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>
        </button>
        <div v-if="colorPalette === 'background'" class="re-color-palette" @mousedown.prevent>
          <button class="re-color-none" type="button" title="取消背景色"
                  @click="emit('set-color', { type: 'background', color: null, close: true })">
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
              @click="emit('set-color', { type: 'background', color, close: true })"
            ></button>
          </div>
          <label class="re-color-custom-picker" title="打开调色板" aria-label="打开调色板">
            <span class="re-color-custom-swatch" :style="{ backgroundColor }"></span>
            <svg class="re-color-custom-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0 0 18h1.5a1.7 1.7 0 0 0 .9-3.15 1.7 1.7 0 0 1 .9-3.15H17a4 4 0 0 0 4-4C21 6.45 17.15 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="7.5" cy="10" r="1.2" fill="currentColor"/>
              <circle cx="10.5" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="14.5" cy="7.5" r="1.2" fill="currentColor"/>
              <circle cx="16.5" cy="11" r="1.2" fill="currentColor"/>
            </svg>
            <input type="color" :value="backgroundColor" @input="onBackgroundColorInput" />
          </label>
        </div>
      </div>

      <span class="re-sep"></span>

      <!-- 列表 -->
      <button class="re-btn" :class="{ active: active.bulletList }" @click="emit('toggle-list', 'bulletList')"
              title="无序列表">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.orderedList }" @click="emit('toggle-list', 'orderedList')"
              title="有序列表">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.blockquote }" @click="emit('run-command', 'blockquote')"
              title="引用">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round"><path d="M4 5v14"/><path d="M9 8h11M9 12h11M9 16h7"/></svg>
      </button>

      <span class="re-sep"></span>

      <!-- 对齐 -->
      <button class="re-btn" :class="{ active: active.alignLeft }" @click="emit('set-align', 'left')" title="左对齐">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.alignCenter }" @click="emit('set-align', 'center')" title="居中对齐">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.alignRight }" @click="emit('set-align', 'right')" title="右对齐">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
      </button>
      <button class="re-btn" :class="{ active: active.alignJustify }" @click="emit('set-align', 'justify')"
              title="两端对齐">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/></svg>
      </button>

      <span class="re-sep"></span>

      <!-- 插入 -->
      <button class="re-btn" :class="{ active: active.codeBlock }" @click="emit('toggle-code-block')" title="代码块">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
      </button>
      <div class="re-image-insert">
        <button class="re-btn" @click="pickImage" title="插入图片（本地上传）">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
        <button
          class="re-image-arrow"
          :class="{ active: imagePanelVisible }"
          type="button"
          title="插入网络图片"
          aria-label="插入网络图片"
          :aria-expanded="imagePanelVisible"
          @click="emit('toggle-image-panel')"
        >
          <svg class="re-color-arrow" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>
        </button>
        <div v-if="imagePanelVisible" class="re-image-panel">
          <label class="re-image-field">
            <span class="re-image-label">图片地址</span>
            <input
              ref="imageUrlInput"
              :value="networkImageUrl"
              class="re-image-input"
              type="text"
              placeholder="https://example.com/a.png"
              @input="onNetworkImageUrlInput"
              @keydown.enter.prevent="emit('insert-network-image')"
            />
          </label>
          <label class="re-image-field">
            <span class="re-image-label">名称</span>
            <input
              :value="networkImageName"
              class="re-image-input"
              type="text"
              placeholder="可选，作为图片描述"
              @input="onNetworkImageNameInput"
              @keydown.enter.prevent="emit('insert-network-image')"
            />
          </label>
          <div class="re-image-panel-actions">
            <button class="re-image-upload" type="button" @click="pickImage">本地上传</button>
            <button class="re-image-confirm" type="button" @click="emit('insert-network-image')">插入</button>
          </div>
        </div>
      </div>
      <button class="re-btn" @click="pickVideo" title="插入视频">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
      </button>
      <div
        class="re-table-insert"
        :title="selectionInTable ? '单元格内不能插入表格' : '插入表格'"
        @mouseleave="resetTablePickerPreview"
      >
        <button
          class="re-btn"
          :class="{ active: tablePickerVisible && !selectionInTable }"
          type="button"
          :disabled="selectionInTable"
          :aria-disabled="selectionInTable"
          @click="emit('toggle-table-picker')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/></svg>
        </button>
        <div v-if="tablePickerVisible" class="re-table-picker" @mousedown.prevent>
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
              @click="selectTableSize(cell.row, cell.col)"
            ></button>
          </div>
          <div class="re-table-picker-size">{{ tablePickerRows }} x {{ tablePickerCols }}</div>
        </div>
      </div>
      <button class="re-btn" @click="emit('run-command', 'horizontalRule')" title="分割线">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>
      </button>

      <span class="re-sep"></span>

      <!-- 撤销 / 重做 -->
      <button class="re-btn" :disabled="!canUndo" @click="emit('run-command', 'undo')" title="撤销 (Ctrl+Z)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
      </button>
      <button class="re-btn" :disabled="!canRedo" @click="emit('run-command', 'redo')" title="重做 (Ctrl+Y)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
      </button>
    </div>

    <!-- 本地文件选择：选中后交由父级上传 -->
    <input ref="imageInput" type="file" accept="image/*" hidden @change="onImageChange" />
    <input ref="videoInput" type="file" accept="video/*" hidden @change="onVideoChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  blockTypes,
  commonColors,
  fonts,
  TABLE_PICKER_COLS,
  TABLE_PICKER_DEFAULT_COLS,
  TABLE_PICKER_DEFAULT_ROWS,
  TABLE_PICKER_ROWS,
} from './config';
import type {
  ColorPayload,
  ColorTarget,
  SimpleCommand,
  TextAlignValue,
  ToolbarActiveState,
} from './composables/useEditorToolbar';

// 纯 UI 组件：只渲染 props 并向上抛命令，不直接操作编辑器
const props = defineProps<{
  blockType: string;
  font: string;
  textColor: string;
  backgroundColor: string;
  colorPalette: ColorTarget | null;
  tablePickerVisible: boolean;
  imagePanelVisible: boolean;
  networkImageUrl: string;
  networkImageName: string;
  selectionInTable: boolean;
  active: ToolbarActiveState;
  canUndo: boolean;
  canRedo: boolean;
}>();

const emit = defineEmits<{
  (e: 'set-block', value: string): void;
  (e: 'set-font', value: string): void;
  (e: 'run-command', name: SimpleCommand): void;
  (e: 'open-link'): void;
  (e: 'set-align', value: TextAlignValue): void;
  (e: 'toggle-list', value: 'bulletList' | 'orderedList'): void;
  (e: 'toggle-code-block'): void;
  (e: 'set-color', payload: ColorPayload): void;
  (e: 'toggle-color-palette', type: ColorTarget): void;
  (e: 'toggle-table-picker'): void;
  (e: 'insert-table', size: { rows: number; cols: number }): void;
  (e: 'toggle-image-panel'): void;
  (e: 'pick-image'): void;
  (e: 'insert-network-image'): void;
  (e: 'select-file', payload: { kind: 'image' | 'video'; file: File }): void;
  (e: 'update:networkImageUrl', value: string): void;
  (e: 'update:networkImageName', value: string): void;
}>();

const toolbarRef = ref<HTMLElement>();
const imageInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();
const imageUrlInput = ref<HTMLInputElement>();

// 浮层与编辑器右边界之间保留的最小间距
const POPUP_GAP = 8;

// 表格选择器的尺寸预览属于纯交互状态，留在组件内部
const tablePickerRows = ref(TABLE_PICKER_DEFAULT_ROWS);
const tablePickerCols = ref(TABLE_PICKER_DEFAULT_COLS);

const tablePickerCells = computed(() =>
  Array.from({ length: TABLE_PICKER_ROWS * TABLE_PICKER_COLS }, (_, index) => ({
    row: Math.floor(index / TABLE_PICKER_COLS) + 1,
    col: (index % TABLE_PICKER_COLS) + 1,
  }))
);

const onBlockChange = (e: Event) => {
  emit('set-block', (e.target as HTMLSelectElement).value);
};

const onFontChange = (e: Event) => {
  emit('set-font', (e.target as HTMLSelectElement).value);
};

const onTextColorInput = (e: Event) => {
  emit('set-color', { type: 'text', color: (e.target as HTMLInputElement).value });
};

const onBackgroundColorInput = (e: Event) => {
  emit('set-color', { type: 'background', color: (e.target as HTMLInputElement).value });
};

const onNetworkImageUrlInput = (e: Event) => {
  emit('update:networkImageUrl', (e.target as HTMLInputElement).value);
};

const onNetworkImageNameInput = (e: Event) => {
  emit('update:networkImageName', (e.target as HTMLInputElement).value);
};

const resetTablePickerPreview = () => {
  tablePickerRows.value = TABLE_PICKER_DEFAULT_ROWS;
  tablePickerCols.value = TABLE_PICKER_DEFAULT_COLS;
};

const previewTableSize = (rows: number, cols: number) => {
  tablePickerRows.value = rows;
  tablePickerCols.value = cols;
};

const selectTableSize = (rows: number, cols: number) => {
  emit('insert-table', { rows, cols });
};

const pickImage = () => {
  emit('pick-image');
  imageInput.value?.click();
};

const pickVideo = () => videoInput.value?.click();

const onImageChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) emit('select-file', { kind: 'image', file });
};

const onVideoChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) emit('select-file', { kind: 'video', file });
};

// 浮层贴着触发按钮展开，右侧空间不足时整体左移，避免被编辑器边界裁掉
const repositionVisiblePopups = () => {
  const container = toolbarRef.value?.closest('.rich-editor') as HTMLElement | null;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const panels = toolbarRef.value!.querySelectorAll<HTMLElement>(
    '.re-color-palette, .re-table-picker, .re-image-panel'
  );

  panels.forEach((panel) => {
    const wrapper = panel.parentElement;
    if (!wrapper) return;

    panel.style.left = '0';
    const wrapperRect = wrapper.getBoundingClientRect();
    const overflow = wrapperRect.left + panel.offsetWidth - (containerRect.right - POPUP_GAP);
    // overflow > 0 说明右侧放不下，左移量最多顶到容器左边界
    const minShift = containerRect.left + POPUP_GAP - wrapperRect.left;
    panel.style.left = overflow > 0 ? `${Math.max(-overflow, minShift)}px` : '0';
  });
};

// 浮层打开后定位；窗口尺寸变化时同步修正
watch(
  () => [props.colorPalette, props.tablePickerVisible, props.imagePanelVisible],
  async () => {
    await nextTick();
    repositionVisiblePopups();
    if (props.imagePanelVisible) imageUrlInput.value?.focus();
  }
);

// 面板收起时重置表格尺寸预览，避免下次打开残留上次悬停值
watch(
  () => props.tablePickerVisible,
  (visible) => {
    if (!visible) resetTablePickerPreview();
  }
);

onMounted(() => window.addEventListener('resize', repositionVisiblePopups));
onBeforeUnmount(() => window.removeEventListener('resize', repositionVisiblePopups));
</script>

<style scoped src="./toolbar.css"></style>
