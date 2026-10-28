<template>
  <div id="note-detail-page">
    <!-- 顶部工具栏 -->
    <div class="note-toolbar">
      <!-- 左侧：分组选择 -->
      <div class="toolbar-left">
        <div class="filter-item">
          <el-select
              v-model="groupValue"
              placeholder="类型"
              size="large"
              clearable
              class="group-select"
              popper-class="group-select-popper"
              :disabled="viewMode === 'preview'"
              @change="changeGroup"
              @clear="handleClear"
          >
            <template #prefix>
              <svg-icon iconClass="filter" className="filter-icon"/>
            </template>
            <el-option
                v-for="item in groups"
                :key="item.id"
                :label="item.groupName"
                :value="item.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 右侧：模式切换 + 操作按钮 -->
      <div class="toolbar-right">
        <!-- 模式切换 -->
        <div class="mode-switch">
          <button
              class="mode-switch-item"
              :class="{ 'is-active': viewMode === 'edit' }"
              @click="viewMode = 'edit'"
          >
            <el-icon>
              <Edit/>
            </el-icon>
            <span>编辑</span>
          </button>
          <button
              class="mode-switch-item"
              :class="{ 'is-active': viewMode === 'preview' }"
              @click="viewMode = 'preview'"
          >
            <el-icon>
              <View/>
            </el-icon>
            <span>预览</span>
          </button>
        </div>

        <!-- 分隔线 -->
        <div class="toolbar-divider"></div>

        <!-- 保存状态：自动保存后静默更新 -->
        <span class="save-status" :class="`is-${saveState}`">{{ saveStatusText }}</span>

        <!-- 保存按钮：保存中与预览态（内容不可改）都不可点击 -->
        <button
            @click="saveNote()"
            class="toolbar-btn toolbar-btn-save"
            :disabled="saving || viewMode === 'preview'"
        >
          <el-icon>
            <DocumentChecked/>
          </el-icon>
          <span class="btn-text">保存</span>
        </button>

        <!-- 删除按钮：新笔记尚未落库，不可删除 -->
        <button
            class="toolbar-btn toolbar-btn-delete"
            :disabled="noteData.noteId === -1"
            @click="deleteDialogVisible = true"
        >
          <el-icon>
            <Delete/>
          </el-icon>
          <span class="btn-text">删除</span>
        </button>
      </div>
    </div>

    <!-- 标题：列表页展示的就是这个标题，正文自动生成的标题可在此改写 -->
    <div class="note-title-bar">
      <input
          v-model="noteTitle"
          class="note-title-input"
          :readonly="viewMode === 'preview'"
          maxlength="100"
          placeholder="无标题"
          @input="markDirty"
      />
      <span class="note-char-count">{{ charCount }} 字</span>
    </div>

    <div class="note-editor-wrap" v-loading="loading">
      <RichEditor
          ref="editorRef"
          v-model="valueHtml"
          :editable="viewMode === 'edit'"
          @change="markDirty"
          @update:char-count="charCount = $event"
      />
    </div>

    <el-dialog
        v-model="deleteDialogVisible"
        align-center
        width="360px"
        :show-close="false"
        class="delete-confirm-dialog"
    >
      <div class="delete-dialog-content">
        <div class="delete-dialog-icon">
          <el-icon>
            <Delete/>
          </el-icon>
        </div>
        <div class="delete-dialog-text">
          <h3>确定删除这篇笔记吗？</h3>
          <p>删除后无法恢复，请确认是否继续。</p>
        </div>
      </div>
      <template #footer>
        <div class="delete-dialog-footer">
          <button class="delete-dialog-btn delete-dialog-btn-cancel" @click="deleteDialogVisible = false">
            取消
          </button>
          <button class="delete-dialog-btn delete-dialog-btn-confirm" @click="confirmDeleteNote">
            确定删除
          </button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue';
import RichEditor from '@/components/RichEditor/index.vue';
import {addNote, deleteNoteItem, editNote, getNote} from "@/network/note/note";
import {onBeforeRouteLeave, useRouter} from 'vue-router';
import {ElMessage, ElMessageBox} from 'element-plus'
import {Delete, DocumentChecked, Edit, View} from '@element-plus/icons-vue'
import {cipherText, decrypted} from "@/utils/aesUtil";
import {closeLoading} from "@/utils/loadingUtil";
import {listNoteGroup} from "@/network/note/noteGroup";

const router = useRouter();

type ViewMode = 'edit' | 'preview';

const props = withDefaults(defineProps<{
  initialViewMode?: ViewMode;
}>(), {
  initialViewMode: 'preview'
});

const noteData = ref({
  noteId: -1,
  groupId: null as number | null
});

const groupValue = ref<number | null>(null);
const groups = ref<any[]>([]);
const deleteDialogVisible = ref(false);
const noteTitle = ref('');
const charCount = ref(0);   // 正文字数，由编辑器同步
const dirty = ref(false);   // 是否有未保存修改
const saving = ref(false);  // 保存请求进行中，避免并发提交
const loading = ref(false); // 笔记内容加载中
const lastSavedAt = ref<Date | null>(null);
const saveError = ref(false);

// 停止输入多久后自动保存
const AUTO_SAVE_DELAY = 3000;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const changeGroup = (newValue: number | string | null) => {
  // 清空时 el-select 可能给到 '' / undefined，统一转成 null 提交
  noteData.value.groupId = newValue ? Number(newValue) : null;
};

const handleClear = () => {
  groupValue.value = null;
  noteData.value.groupId = null;
};


const editorRef = shallowRef();
const valueHtml = ref("");

// 视图模式：edit（编辑）、preview（预览）
const viewMode = ref<ViewMode>(props.initialViewMode);

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

// 状态栏展示优先级：保存中 > 失败 > 未保存 > 已保存
const saveState = computed<SaveState>(() => {
  if (saving.value) return 'saving';
  if (saveError.value) return 'error';
  return dirty.value ? 'dirty' : 'saved';
});

const formatSavedTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const saveStatusText = computed(() => {
  switch (saveState.value) {
    case 'saving':
      return '保存中…';
    case 'dirty':
      return '未保存';
    case 'error':
      return '保存失败';
    default:
      return lastSavedAt.value ? `已保存 ${formatSavedTime(lastSavedAt.value)}` : '已保存';
  }
});

const clearAutoSaveTimer = () => {
  if (!autoSaveTimer) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = null;
};

// 停止输入后自动保存，连续输入会不断重置计时
const scheduleAutoSave = () => {
  clearAutoSaveTimer();
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    void saveNote({ silent: true });
  }, AUTO_SAVE_DELAY);
};

// 统一的未保存入口：置脏、清失败态并安排自动保存
const markDirty = () => {
  dirty.value = true;
  saveError.value = false;
  scheduleAutoSave();
};

// 解密失败（历史明文或异常密文）时回退原文，避免内容被静默清空
const safeDecrypt = (raw: string) => {
  if (!raw) return '';
  try {
    return decrypted(raw) || raw;
  } catch {
    return raw;
  }
};

// 加载笔记：新建（id = -1）与详情共用一套回填逻辑
let loadToken = 0;
const loadNote = async (id: number) => {
  const token = ++loadToken;
  noteData.value.noteId = id;
  loading.value = true;
  clearAutoSaveTimer();

  try {
    if (id === -1) {
      valueHtml.value = '';
      noteTitle.value = '';
      groupValue.value = null;
      noteData.value.groupId = null;
    } else {
      const res = await getNote(id);
      if (token !== loadToken) return; // 已有更新的加载请求，丢弃本次结果

      valueHtml.value = safeDecrypt(res.data?.content || '');
      noteTitle.value = res.data?.title || '';
      const groupId = res.data?.groupId ?? null;
      groupValue.value = groupId === null ? null : Number(groupId);
      noteData.value.groupId = groupId === null ? null : Number(groupId);
    }

    if (token === loadToken) {
      dirty.value = false;
      saveError.value = false;
    }
  } catch {
    ElMessage.error('笔记加载失败');
  } finally {
    // 多个加载请求并发时，只由最后一次负责收起加载态
    if (token === loadToken) loading.value = false;
  }
};

// 未保存确认弹窗：返回 true 表示确认放弃修改
const confirmDiscard = async (message: string) => {
  try {
    await ElMessageBox.confirm(message, '未保存提醒', {
      confirmButtonText: '离开',
      cancelButtonText: '继续编辑',
      type: 'warning',
    });
    return true;
  } catch {
    return false;
  }
};

// 正文变动由编辑器 @change 立即通知（标题走输入事件），这里无需再监听 v-model

// 切到预览时把未保存的改动落库，让预览始终对应已保存的内容
watch(viewMode, (mode) => {
  if (mode === 'preview' && dirty.value) void saveNote({ silent: true });
});

// 同一路由复用组件时 onMounted 不会再次执行，必须监听参数变化重新加载
watch(() => router.currentRoute.value.params.id, async (val) => {
  const id = Number(val);
  if (!Number.isFinite(id) || id === noteData.value.noteId) return;

  // 同页切换笔记同样要保护未保存内容，取消时回退地址，保持界面与 URL 一致
  if (dirty.value) {
    const previousId = noteData.value.noteId;
    if (!(await confirmDiscard('当前笔记有未保存的修改，切换后将丢失，确定继续吗？'))) {
      await router.replace({
        path: `/noteDetail/${previousId}`,
        query: router.currentRoute.value.query,
      });
      return;
    }
  }

  await loadNote(id);
});

// 外部带 query 进入（或刷新）时同步视图模式
watch(() => router.currentRoute.value.query.viewMode, (val) => {
  viewMode.value = val === 'edit' ? 'edit' : 'preview';
});

// 刷新/关闭标签页无法自定义文案，只触发浏览器原生确认
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!dirty.value) return;
  // 现代浏览器统一由 preventDefault 触发原生确认（returnValue 已废弃）
  event.preventDefault();
};

onMounted(async () => {
  const paramId = Number(router.currentRoute.value.params.id);
  const initialId = Number.isFinite(paramId) ? paramId : -1;

  // 分组列表独立加载，不阻塞笔记内容
  listNoteGroup(-1, -1).then((res) => {
    groups.value = res.data.records || [];

    // 如果是新建笔记且没有选中分组，则默认选中第一个分组
    if (initialId === -1 && !groupValue.value && groups.value.length > 0) {
      groupValue.value = Number(groups.value[0].id);
      noteData.value.groupId = Number(groups.value[0].id);
    }
  });

  window.addEventListener('keydown', handleEvent);
  window.addEventListener('beforeunload', handleBeforeUnload);

  await loadNote(initialId);
  closeLoading();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEvent);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  if (ctrlSTimer) clearTimeout(ctrlSTimer);
  clearAutoSaveTimer();
});

// 有未保存修改时，离开页面需二次确认
onBeforeRouteLeave(async () => {
  if (!dirty.value) return true;
  return confirmDiscard('当前笔记有未保存的修改，确定离开吗？');
});

// 将编辑器纯文本整理为标题，回车和连续空白统一转为空格。
const buildNoteTitle = (text: string) => {
  return text.replace(/\s+/g, ' ').trim().substring(0, 100);
};

// silent 用于自动保存：状态只在工具栏展示，不弹全局提示
const saveNote = async (options: { silent?: boolean } = {}) => {
  const { silent = false } = options;
  const editor = editorRef.value;
  if (!editor || saving.value) return;
  if (silent && !dirty.value) return;

  // 标题优先取输入框，留空时退回正文自动生成，并回填到输入框保持界面与实际一致
  const title = noteTitle.value.trim() || buildNoteTitle(editor.getText());
  noteTitle.value = title;
  const snapshot = editor.getHTML();
  const noteValue = cipherText(snapshot);

  // 保存期间继续编辑的内容不算已保存，用快照比对决定是否清除脏标记
  const markSaved = () => {
    dirty.value = editor.getHTML() !== snapshot || noteTitle.value !== title;
    saveError.value = false;
    lastSavedAt.value = new Date();
  };

  clearAutoSaveTimer();
  saving.value = true;
  let saved = false;

  try {
    if (noteData.value.noteId === -1) {
      const res = await addNote(null, noteValue, title, noteData.value.groupId);
      if (res.code !== 200 || !res.data) {
        saveError.value = true;
        if (!silent) ElMessage.error(res.msg || '保存失败');
        return;
      }
      noteData.value.noteId = res.data;
      markSaved();
      saved = true;
      // 保留 query（viewMode），否则首次保存后会被 query watch 打回预览模式
      void router.replace({
        path: `/noteDetail/${res.data}`,
        query: router.currentRoute.value.query,
      });
      if (!silent) ElMessage.success('保存成功！');
    } else {
      const res = await editNote(noteData.value.noteId, noteValue, title, noteData.value.groupId);
      if (res.code !== 200) {
        saveError.value = true;
        if (!silent) ElMessage.error(res.msg || '保存失败');
        return;
      }
      markSaved();
      saved = true;
      if (!silent) ElMessage.success('保存成功！');
    }
  } catch {
    saveError.value = true;
    if (!silent) ElMessage.error('保存失败，请稍后重试');
  } finally {
    saving.value = false;
    // 保存期间又有新改动时，等这一轮结束后再安排下一次
    if (saved && dirty.value) scheduleAutoSave();
  }
};

const delNote = () => {
  if (noteData.value.noteId === -1) {
    ElMessage.warning('新笔记无法删除');
    return;
  }
  deleteNoteItem(noteData.value.noteId).then(() => {
    // 删除成功后不再拦截离开，并取消可能待触发的自动保存
    clearAutoSaveTimer();
    dirty.value = false;
    saveError.value = false;
    ElMessage.success('删除成功！');
    router.push(`/note`);
  });
};

const confirmDeleteNote = () => {
  deleteDialogVisible.value = false;
  delNote();
};


let ctrlSTimer: ReturnType<typeof setTimeout> | null = null;

// 兼容 Windows/Linux 的 Ctrl 与 macOS 的 Cmd
const isModifierKey = (event: KeyboardEvent) => event.ctrlKey || event.metaKey;

function handleEvent(event: KeyboardEvent) {
  // 统一转小写，避免开启 Caps Lock 后组合键失效
  const key = event.key.toLowerCase();

  if (isModifierKey(event) && key === 'd') {
    if (viewMode.value === 'preview') {
      event.preventDefault();
      return;
    }

    if (viewMode.value === 'edit') {
      event.preventDefault();
      editorRef.value?.deleteCurrentLine();
      return;
    }

  }

  // 保留 Ctrl/Cmd + Shift + S 给浏览器自身的"另存为"
  if (isModifierKey(event) && key === 's' && !event.shiftKey) {
    event.preventDefault();
    // 多次触发 给出提示
    if (ctrlSTimer) {
      ElMessage({
        message: `⚡️ 少侠，你的手速突破系统结界啦！`,
        type: 'success',
      });
      return;
    }
    saveNote();
    ctrlSTimer = setTimeout(() => {
      ctrlSTimer = null;
    }, 1000); // 1秒内无法重复保存
  }
}

</script>

<style scoped>
#note-detail-page {
  /* 父级 .app-content 已占满 header 以下空间，这里跟随父级高度，避免写死 header 尺寸 */
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

/* 编辑区容器：撑满剩余高度，滚动交给编辑器内部 */
.note-editor-wrap {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  margin-top: 5px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  overflow: hidden;
}

/* 顶部工具栏 */
.note-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background: #fff;
  flex-shrink: 0;
  min-height: 45px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.filter-item {
  transition: all 0.3s ease;
  width: 148px;
  flex-shrink: 0;
  flex-grow: 0;
}

@media screen and (max-width: 768px) {
  .filter-item {
    width: 120px;
  }
}

@media screen and (max-width: 500px) {
  .filter-item {
    width: 104px;
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* 模式切换器 */
.mode-switch {
  display: inline-flex;
  background-color: #e8eaed;
  padding: 3px;
  border-radius: 6px;
  height: 36px;
  gap: 0;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.mode-switch-item {
  height: 30px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  position: relative;
}

.mode-switch-item .el-icon {
  font-size: 15px;
}

.mode-switch-item:hover:not(.is-active) {
  color: #202124;
  background-color: rgba(0, 0, 0, 0.04);
}

.mode-switch-item.is-active {
  background-color: #fff;
  color: #202124;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
}


/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: #e8e8e8;
  flex-shrink: 0;
}

/* 标题栏：左内边距与正文对齐，预览态只读 */
.note-title-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: 6px 25px 0;
  background-color: #fff;
}

.note-title-input {
  flex: 1;
  min-width: 0;
  padding: 6px 0;
  border: none;
  outline: none;
  background: transparent;
  color: #202124;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
}

/* 正文字数：常驻标题行右侧，不占用工具栏空间 */
.note-char-count {
  flex-shrink: 0;
  color: #9aa0a6;
  font-size: 12px;
  white-space: nowrap;
}

.note-title-input::placeholder {
  color: #bdc1c6;
  font-weight: 500;
}

.note-title-input[readonly] {
  cursor: default;
}

/* 分组选择器 */
.group-select {
  width: 148px;
  --el-select-input-focus-border-color: transparent;
  --el-select-border-color-hover: #c7c9cc;
}

.group-select :deep(.el-select__wrapper),
.group-select :deep(.el-input__wrapper) {
  min-height: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
  padding: 0 10px;
  gap: 7px;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
  box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.group-select:hover :deep(.el-select__wrapper),
.group-select :deep(.el-select__wrapper.is-hovering),
.group-select :deep(.el-input__wrapper:hover) {
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.group-select :deep(.el-select__wrapper.is-focused),
.group-select :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.group-select :deep(.el-select__prefix) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 1px;
  border-radius: 50%;
  background: #f1f3f4;
  color: #5f6368;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
  color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.group-select:hover :deep(.el-select__prefix),
.group-select :deep(.el-select__wrapper.is-focused .el-select__prefix) {
  background: #e8eaed;
  color: #202124;
}

.group-select :deep(.el-select__selection) {
  min-width: 0;
}

.group-select :deep(.el-select__placeholder) {
  color: #5f6368;
  font-weight: 500;
}

.group-select :deep(.el-select__placeholder.is-transparent) {
  color: #80868b;
  font-weight: 500;
}

.group-select :deep(.el-select__caret) {
  color: #80868b;
  font-size: 14px;
}

.group-select:hover :deep(.el-select__caret),
.group-select :deep(.el-select__wrapper.is-focused .el-select__caret) {
  color: #5f6368;
}

.group-select :deep(.el-select__suffix) {
  margin-left: 0;
}

.group-select :deep(.el-select__selected-item) {
  min-width: 0;
}

.group-select :deep(.el-input__inner) {
  height: 34px;
  line-height: 34px;
  color: #202124;
  font-size: 13px;
  font-weight: 500;
}

.filter-icon {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.el-select {
  transition: box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-select:focus-within {
  border-radius: 6px;
}

.group-select:focus,
.group-select:focus-visible,
.group-select:focus-within,
.group-select :deep(.el-select__wrapper:focus),
.group-select :deep(.el-select__wrapper:focus-visible),
.group-select :deep(.el-input__wrapper:focus),
.group-select :deep(.el-input__wrapper:focus-visible) {
  outline: none;
}

:global(.group-select-popper.el-select__popper.el-popper) {
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(32, 33, 36, 0.16), 0 2px 8px rgba(32, 33, 36, 0.08);
}

:global(.group-select-popper.el-select__popper.el-popper .el-popper__arrow::before) {
  border-color: #dadce0;
  background: #fff;
}

:global(.group-select-popper .el-select-dropdown__list) {
  padding: 6px;
}

:global(.group-select-popper .el-select-dropdown__item) {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  color: #5f6368;
  font-size: 13px;
  font-weight: 500;
  line-height: 32px;
}

:global(.group-select-popper .el-select-dropdown__item.is-hovering) {
  background: #f1f3f4;
  color: #202124;
}

:global(.group-select-popper .el-select-dropdown__item.is-selected) {
  background: #e8eaed;
  color: #202124;
  font-weight: 600;
}

/* 保存状态文字：颜色区分已保存 / 未保存 / 保存中 / 失败；固定宽度避免按钮位移 */
.save-status {
  flex-shrink: 0;
  min-width: 84px;
  color: #80868b;
  font-size: 12px;
  line-height: 1;
  text-align: right;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.save-status.is-saved {
  color: #188038;
}

.save-status.is-dirty {
  color: #b06000;
}

.save-status.is-saving {
  color: #5f6368;
}

.save-status.is-error {
  color: #d93025;
}

/* 工具栏按钮 */
.toolbar-btn {
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: #fff;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.toolbar-btn:hover {
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.toolbar-btn:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

/* 保存中 / 预览态禁用 */
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.toolbar-btn .el-icon {
  font-size: 15px;
}

.btn-text {
  font-size: 13px;
  font-weight: 500;
}

/* 保存按钮 */
.toolbar-btn-save {
  background-color: #5f6368;
  color: #fff;
  border-color: transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
}

.toolbar-btn-save:hover {
  background-color: #202124;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12);
}

.toolbar-btn-save:active {
  background-color: #3c4043;
  transform: scale(0.98);
}

/* 删除按钮 */
.toolbar-btn-delete {
  background-color: #fff;
  color: #d93025;
  border-color: transparent;
}

.toolbar-btn-delete:hover {
  background-color: #fce8e6;
  color: #c5221f;
}

.toolbar-btn-delete:active {
  background-color: #f9dedc;
}

#note-detail-page :deep(.delete-confirm-dialog) {
  --el-dialog-padding-primary: 0;
  border: 1px solid #f3c4bf;
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(32, 33, 36, 0.2), 0 4px 14px rgba(217, 48, 37, 0.12);
}

#note-detail-page :deep(.delete-confirm-dialog .el-dialog__header) {
  display: none;
}

#note-detail-page :deep(.delete-confirm-dialog .el-dialog__body) {
  padding: 20px 20px 0;
}

#note-detail-page :deep(.delete-confirm-dialog .el-dialog__footer) {
  padding: 18px 20px 20px;
}

.delete-dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.delete-dialog-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fce8e6;
  color: #d93025;
  font-size: 18px;
}

.delete-dialog-text h3 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
}

.delete-dialog-text p {
  margin: 6px 0 0;
  color: #5f6368;
  font-size: 13px;
  line-height: 1.6;
}

.delete-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.delete-dialog-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  line-height: 30px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-dialog-btn-cancel {
  border-color: #dadce0;
  background: #fff;
  color: #5f6368;
}

.delete-dialog-btn-cancel:hover {
  background: #f8f9fa;
  border-color: #c7c9cc;
  color: #202124;
}

.delete-dialog-btn-confirm {
  background: #d93025;
  color: #fff;
  box-shadow: 0 1px 3px rgba(217, 48, 37, 0.22);
}

.delete-dialog-btn-confirm:hover {
  background: #c5221f;
  box-shadow: 0 2px 6px rgba(217, 48, 37, 0.28);
}

.delete-dialog-btn:active {
  transform: scale(0.98);
}

.delete-dialog-btn:focus-visible {
  outline: 2px solid rgba(217, 48, 37, 0.28);
  outline-offset: 2px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .note-title-input {
    font-size: 20px;
  }

  .note-toolbar {
    padding: 6px 10px;
    flex-wrap: nowrap;
    gap: 8px;
    min-height: auto;
    align-items: center;
  }

  .toolbar-left {
    flex: 0 0 auto;
  }

  .toolbar-right {
    flex: 1 1 auto;
    justify-content: flex-end;
    gap: 6px;
  }

  .toolbar-divider {
    display: none;
  }

  /* 小屏空间紧张，状态文字隐藏，保存结果仍可从按钮文案感知 */
  .save-status {
    display: none;
  }

  .group-select {
    width: 120px;
  }

  .group-select :deep(.el-select__wrapper),
  .group-select :deep(.el-input__wrapper) {
    min-height: 30px;
    height: 30px;
    padding: 0 8px;
    gap: 5px;
  }

  .group-select :deep(.el-select__prefix) {
    width: 20px;
    height: 20px;
  }

  .group-select :deep(.el-select__caret) {
    font-size: 12px;
  }

  .group-select :deep(.el-input__inner) {
    height: 28px;
    line-height: 28px;
    font-size: 12px;
  }

  .toolbar-btn {
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
  }

  .toolbar-btn .el-icon {
    font-size: 14px;
  }

  .mode-switch {
    height: 30px;
    padding: 2px;
  }

  .mode-switch-item {
    height: 26px;
    padding: 0 10px;
    font-size: 12px;
    gap: 4px;
  }

  .mode-switch-item .el-icon {
    font-size: 14px;
  }

  #note-detail-page :deep(.delete-confirm-dialog) {
    width: calc(100vw - 32px) !important;
    max-width: 360px;
  }
}

</style>

