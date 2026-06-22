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

        <!-- 保存按钮 -->
        <button
            @click="saveNote"
            class="toolbar-btn toolbar-btn-save"
        >
          <el-icon>
            <DocumentChecked/>
          </el-icon>
          <span class="btn-text">保存</span>
        </button>

        <!-- 删除按钮 -->
        <button
            class="toolbar-btn toolbar-btn-delete"
            @click="deleteDialogVisible = true"
        >
          <el-icon>
            <Delete/>
          </el-icon>
          <span class="btn-text">删除</span>
        </button>
      </div>
    </div>

    <div
        style="border: 1px solid #ccc; margin-top: 5px; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <RichEditor ref="editorRef" v-model="valueHtml" :editable="viewMode === 'edit'"/>
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
import {onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue';
import RichEditor from '@/components/RichEditor/index.vue';
import {addNote, deleteNoteItem, editNote, getNote} from "@/network/base";
import {useRouter} from 'vue-router';
import {ElMessage} from 'element-plus'
import {Delete, DocumentChecked, Edit, View} from '@element-plus/icons-vue'
import {cipherText, decrypted} from "@/utils/aesUtil";
import {closeLoading} from "@/utils/loadingUtil";
import {listNoteGroup} from "@/network/noteGroup";

const router = useRouter();

const noteData = ref({
  noteId: -1,
  groupId: null as number | null
});

const groupValue = ref('');
const groups = ref<any[]>([]);
const deleteDialogVisible = ref(false);

const changeGroup = (newValue: string) => {
  noteData.value.groupId = newValue ? Number(newValue) : null;
};

const handleClear = () => {
  groupValue.value = '';
  noteData.value.groupId = null;
};


const editorRef = shallowRef();
const valueHtml = ref("");

// 视图模式：edit（编辑）、preview（预览）
const viewMode = ref('preview');

// 监听视图模式变化
watch(viewMode, (newMode) => {
  ElMessage.success(newMode === 'edit' ? '进入编辑模式' : '进入预览模式');
});

onMounted(() => {
  const paramId = Number(router.currentRoute.value.params.id);
  noteData.value.noteId = paramId;

  if (paramId !== -1) {
    getNote(paramId).then((res) => {
      if (res.data.content == null) {
        res.data.content = ''
      }
      valueHtml.value = decrypted(res.data.content);
      groupValue.value = res.data.groupId;
      noteData.value.groupId = res.data.groupId;
    });
  }

  listNoteGroup(-1, -1).then((res) => {
    groups.value = res.data.records;

    // 如果是新建笔记且没有选中分组，则默认选中第一个分组
    if (paramId === -1 && !groupValue.value && groups.value && groups.value.length > 0) {
      groupValue.value = groups.value[0].id;
      noteData.value.groupId = Number(groups.value[0].id);
    }
  });


  window.addEventListener('keydown', handleEvent);
  closeLoading();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEvent);
});

// 将 html格式 提取为 只要正文
const extractTitleFromHtml = (htmlString: string) => {
  // 将内容转成标签
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  // 提取标签里面的所有文字
  let title = doc.body.textContent || "";
  return title.replace(/\s+/g, ' ').trim().substring(0, 200);
};

const saveNote = () => {
  const editor = editorRef.value;
  if (!editor) return;

  let noteValue = editor.getHTML();
  let title = extractTitleFromHtml(noteValue);
  noteValue = cipherText(noteValue);

  if (noteData.value.noteId === -1) {
    addNote(null, noteValue, title, noteData.value.groupId).then((res) => {
      if (res.code === 200) {
        ElMessage.success('保存成功！');
        if (res.data) {
          router.replace(`/noteDetail/${res.data}`);
          noteData.value.noteId = res.data;
        }
      }
    });
  } else {
    editNote(noteData.value.noteId, noteValue, title, noteData.value.groupId).then((res) => {
      ElMessage.success('保存成功！');
    });
  }
};

const delNote = () => {
  if (noteData.value.noteId === -1) {
    ElMessage.warning('新笔记无法删除');
    return;
  }
  deleteNoteItem(noteData.value.noteId).then(() => {
    ElMessage.success('删除成功！');
    router.push(`/note`);
  });
};

const confirmDeleteNote = () => {
  deleteDialogVisible.value = false;
  delNote();
};


let ctrlS_timer: NodeJS.Timeout | null = null;

function handleEvent(event: KeyboardEvent) {
  if (event.ctrlKey && event.key.toLowerCase() === 'd' ) {
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

  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    // 多次触发 给出提示
    if (ctrlS_timer) {
      ElMessage({
        message: `⚡️ 少侠，你的手速突破系统结界啦！`,
        type: 'success',
      });
      return;
    }
    saveNote();
    ctrlS_timer = setTimeout(() => {
      ctrlS_timer = null;
    }, 1000); // 1秒内无法重复保存
  }
}

</script>

<style scoped>
#note-detail-page {
  height: calc(100vh - 64px); /* 减去 AppLayout header 的高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
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
  #note-detail-page {
    height: calc(100vh - 56px);  /* 减去layout-header的高度 */
    overflow: hidden; /* 确保移动端也不会出现页面级滚动 */
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

