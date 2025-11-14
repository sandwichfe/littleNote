<template>
  <div id="note-detail-page">
    <!-- 顶部工具栏 -->
    <div class="note-toolbar">
      <!-- 左侧：分组选择 -->
      <div class="toolbar-left">
        <el-select
          v-model="groupValue"
          placeholder="选择分组"
          class="group-select"
          @change="changeGroup"
        >
          <el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" />
        </el-select>
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
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </button>
          <button
            class="mode-switch-item"
            :class="{ 'is-active': viewMode === 'preview' }"
            @click="viewMode = 'preview'"
          >
            <el-icon><View /></el-icon>
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
          <el-icon><DocumentChecked /></el-icon>
          <span class="btn-text">保存</span>
        </button>

        <!-- 删除按钮 -->
        <el-popconfirm
          title="确定删除这篇笔记吗？"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @confirm="delNote"
        >
          <template #reference>
            <button class="toolbar-btn toolbar-btn-delete">
              <el-icon><Delete /></el-icon>
              <span class="btn-text">删除</span>
            </button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <div style="border: 1px solid #ccc; margin-top: 5px; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" style="border-bottom: 1px solid #ccc;"
        id="editor-Toolbar" />
      <div style="flex-grow: 1; overflow-y: auto;">
        <Editor id="myEditor" :defaultConfig="editorConfig" :mode="mode" v-model="valueHtml"
          :style="{ height: '100%' }"
          @onCreated="handleCreated" @onChange="handleChange" @onDestroyed="handleDestroyed" @onFocus="handleFocus"
          @onBlur="handleBlur" @customAlert="customAlert" @customPaste="customPaste" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { onBeforeUnmount, ref, shallowRef, onMounted, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { getNote, editNote, addNote, deleteNoteItem, uploadImage } from "@/network/base";
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus'
import { Edit, View, DocumentChecked, Delete } from '@element-plus/icons-vue'
import { cipherText, decrypted } from "@/utils/aesUtil";
import { openLoading, closeLoading } from "@/utils/loadingUtil";
import { listNoteGroup } from "@/network/noteGroup";
import { toolbarKeys } from '@/config/editorToolbarConfig';

const router = useRouter();

const noteData = ref({
  noteId: -1,
  groupId: null as number | null
});

const groupValue = ref('');
const groups = ref<any[]>([]);

const changeGroup = (newValue: string) => {
  noteData.value.groupId = newValue ? Number(newValue) : null;
};



const editStatus = ref(false);
const mode = ref('default');
const editorRef = shallowRef();
const valueHtml = ref("");

// 视图模式：edit（编辑）、preview（预览）
const viewMode = ref('preview');

// 监听视图模式变化
watch(viewMode, (newMode) => {
  const editor = editorRef.value;
  if (!editor) return;

  if (newMode === 'edit') {
    editor.enable();
    editStatus.value = true;
  } else {
    editor.disable();
    editStatus.value = false;
  }
});

const toolbarConfig = {
  toolbarKeys
};

const editorConfig = {
  placeholder: '',
  readOnly: true, 
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: any) { // InsertFnType is not exported, use any
        try {
          const fileName = file.name === 'image.png' ? `${Date.now()}.png` : file.name;
          const uploadFile = new File([file], fileName, { type: file.type });
          const response = await uploadImage(uploadFile);
          const url = `${import.meta.env.VITE_OSS_LOAD_BASE_URL}/${response.data}`;
          insertFn(url, fileName, url);
        } catch (error) {
          console.error('上传失败:', error);
          ElMessage.error('图片上传失败');
        }
      },
    }
  }
};

onMounted(() => {
  const paramId = Number(router.currentRoute.value.params.id);
  noteData.value.noteId = paramId;

  if (paramId !== -1) {
    getNote(paramId).then((res) => {
      if (res.content == null) {
        res.content = ''
      }
      valueHtml.value = decrypted(res.content);
      groupValue.value = res.groupId;
      noteData.value.groupId = res.groupId;
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
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }

  window.removeEventListener('keydown', handleEvent);
});

const handleCreated = (editor: any) => {
  editorRef.value = editor;

  // 使用 nextTick 确保 DOM 已更新
  // nextTick(() => {
  //   // 获取工具栏实例
  //   const toolbar = DomEditor.getToolbar(editor);
  //   if (toolbar) {
  //     // 获取当前工具栏配置
  //     const curToolbarConfig = toolbar.getConfig();
  //     // 查看当前菜单排序和分组
  //     console.log(curToolbarConfig.toolbarKeys);
  //   } else {
  //     console.warn('toolbar 实例为 null');
  //   }
  //
  //   // 查询编辑器注册的所有菜单 key
  //   console.log(editor.getAllMenuKeys());
  // });

};

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

  let noteValue = editor.getHtml();
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



let ctrlS_timer: NodeJS.Timeout | null = null;

function handleEvent(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    // 多次触发 给出提示
    if (ctrlS_timer) {
      ElMessage({
        message: `⚡️ 少侠，你的手速突破系统结界啦！`,
        type:'success',
      });
      return;
    }
    saveNote();
    ctrlS_timer = setTimeout(() => {
      ctrlS_timer = null;
    }, 1000); // 1秒内无法重复保存
  }
}

// Empty functions from original editor, can be removed if not used
const handleChange = (editor: any) => {};
const handleDestroyed = (editor: any) => {};
const handleFocus = (editor: any) => {};
const handleBlur = (editor: any) => {};
const customAlert = (info: any, type: any) => {};
const customPaste = (editor: any, event: any, callback: any) => { callback(true) };

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
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  min-height: 56px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
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
  width: 140px;
}

.group-select :deep(.el-input__wrapper) {
  height: 36px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.2s;
  background-color: #fff;
}

.group-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px #c0c4cc inset;
}

.group-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.group-select :deep(.el-input__inner) {
  height: 34px;
  line-height: 34px;
  font-size: 14px;
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

.w-e-scroll {
  min-height: 300px !important; /* use important to override default styles */
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  #note-detail-page {
    height: calc(100vh - 56px); /* 移动端 header 高度为 56px */
  }

  .note-toolbar {
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 10px;
    min-height: auto;
  }

  .toolbar-left {
    flex: 1 1 auto;
  }

  .toolbar-right {
    flex: 1 1 100%;
    justify-content: flex-start;
    gap: 8px;
    margin-top: 8px;
  }

  .toolbar-divider {
    display: none; /* 移动端隐藏分隔线 */
  }

  .group-select {
    width: 120px;
  }

  .toolbar-btn {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
  }

  .mode-switch-item {
    height: 28px;
    padding: 0 12px;
    font-size: 12px;
  }
}

/* 小屏幕手机 */
@media screen and (max-width: 480px) {
  .btn-text {
    display: none; /* 隐藏按钮文字，只显示图标 */
  }

  .toolbar-btn {
    padding: 0 10px;
    min-width: 36px;
  }

  .toolbar-btn-save {
    padding-right: 10px;
  }
}

</style>

