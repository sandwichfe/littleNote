<template>
  <div id="note-detail-page">
    <div class="edit-button-box">
      <!-- 分组筛选 -->
      <div>
        <el-select v-model="groupValue" placeholder="Select" style="width: 120px;height: 32px;margin-right: 10px;"
          @change="changeGroup">
          <el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" />
        </el-select>
      </div>

      <el-button @click="editOrPreview">{{ !editStatus ? '编辑' : '预览' }}</el-button>
      <el-button @click="saveNote" plain type="primary">保存</el-button>
      <div style="height: 32px; margin-left: 14px; margin-bottom: 10px;">
        <el-popconfirm title="确定删除吗?" @confirm="delNote">
          <template #reference>
            <el-button plain type="danger" style="margin-top: 5px;">删除</el-button>
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
import { onBeforeUnmount, ref, shallowRef, onMounted, nextTick } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { DomEditor } from '@wangeditor/editor'
import { getNote, editNote, addNote, deleteNoteItem, uploadImage } from "@/network/base";
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus'
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

const editOrPreview = () => {
  const editor = editorRef.value;
  if (!editor) return;
  if (editStatus.value) {
    editor.disable();
    ElMessage.success('已禁用编辑！');
  } else {
    editor.enable();
    ElMessage.success('已开启编辑！');
  }
  editStatus.value = !editStatus.value;
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.edit-button-box {
  margin-left: 5px;
  margin-top: 2px;
  height: 37px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
}

.w-e-scroll {
  min-height: 300px !important; /* use important to override default styles */
}

</style>

