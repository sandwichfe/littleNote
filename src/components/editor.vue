<template>
  <div>

    <div class="edit-button-box">
      <!-- 分组筛选 -->
      <div>
        <el-select v-model="groupValue" placeholder="Select"  style="width: 120px;height: 32px;margin-right: 10px;"  @change="changeGroup">
          <el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" />
        </el-select>
      </div>


      <el-button @click="editOrPreview" >{{!editStatus?'编辑':'预览'}}</el-button>
      <el-button @click="saveNote" plain type="primary">保存</el-button>
      <div style="height: 32px; margin-left: 14px; margin-bottom: 10px;">
        <el-popconfirm title="确定删除吗?" @confirm="delNote">
          <template #reference>
            <el-button plain type="danger" style="margin-top: 5px;">删除</el-button>
          </template>
        </el-popconfirm>
      </div>

    </div>



    <div style="border: 1px solid #ccc; margin-top: 5px; ">
      <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" style="border-bottom: 1px solid #ccc;"
        id="editor-Toolbar" />
      <Editor id="myEditor" :defaultConfig="editorConfig" :mode="mode" v-model="valueHtml"
        :style="{ width: '100%', height: pageEditHeight, outline: 'none', overflowY: 'hidden' }"
        @onCreated="handleCreated" @onChange="handleChange" @onDestroyed="handleDestroyed" @onFocus="handleFocus"
        @onBlur="handleBlur" @customAlert="customAlert" @customPaste="customPaste" />
    </div>
    <!-- <div style="margin-top: 10px">
        <textarea
          v-model="valueHtml"
          readonly
          style="width: 100%; height: 200px; outline: none"
        ></textarea>
      </div> -->
  </div>
</template>

<!-- 声明导出组件名 -->
<script lang="ts">
export default {
  name: "editor",
}
</script>
<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { onBeforeUnmount, ref, toRefs, shallowRef, onMounted, nextTick,watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { getNote, editNote, addNote, deleteNoteItem } from "@/network/base";
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus'
import { cipherText, decrypted } from "@/utils/aesUtil";
import { openLoading, closeLoading } from "@/utils/loadingUtil";
import { type noteInterface } from '@/types/note'; // 引入类型
import { listNoteGroup } from "@/network/noteGroup";

const groupValue = ref('')

const groups = ref(
  [
    {
      id: 'Option1',
      groupName: 'Option1',
    },
  ]
)

// 处理选中项变化
const changeGroup = (newValue: string) => {
  let groupId = newValue?Number(newValue):null;
  noteData.value.groupId = groupId;
};





// props 接受父组件传来 并且是只读的 如果需要更改 应该要创建一个副本去更改
const props = defineProps<{
  initNoteData: noteInterface
}>();

// 创建接受的副本用于操作
const noteData = ref(props.initNoteData);

// 声明周期  先初始化子组件  再去初始化 以及挂载它的父组件。
// 在这里打印出来是初始值 估计是因为 它是子组件 先初始化此时处于初始化这一步    然后父组件需要等子组件初始完 在执行自己的初始化以及挂载 那个时候noteData就是最新的值了
// console.log("noteData",noteData.value);

const pageEditHeight = ref(''); // 页面编辑器的高度

// 计算页面高度的函数
const calculateHeight = () => {
  const viewportHeight = window.innerHeight;
  const headerHeight = 37; // 假设有一个固定的底部区域，需从总高度减去这个值
  const otherHeight = 20;
  const editorElement = document.getElementById('editor-Toolbar');
  if (editorElement) {
    pageEditHeight.value = (viewportHeight - headerHeight - otherHeight - editorElement.offsetHeight) + 'px';
  }
};

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      calculateHeight(); // 计算页面高度
    }, 100);  // 延迟100ms，确保 DOM 渲染完成
  });
  window.addEventListener('resize', calculateHeight);  // 监听窗口尺寸变化


  listNoteGroup(-1, -1).then((res) => {
    groups.value = res.data.records;
  });

});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateHeight);  // 移除事件监听器
});

const router = useRouter()

// 默认不可编辑
const editStatus = ref(false);

const mode = ref(null);

// 编辑器实例，必须用 shallowRef，重要！
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref("");

// 模拟 ajax 异步获取内容
onMounted(() => {
  var paramId = Number(router.currentRoute.value.params.id);
  if (paramId == -1) {
    return;
  }
  getNote(paramId).then((res) => {
    // console.log(res)
    if (res.content == null) {
      res.content = ''
    }
    // 编辑器内容
    valueHtml.value = decrypted(res.content);
    // 类型
    groupValue.value = res.groupId;
  });
}
);

const toolbarConfig = {};

const editorConfig = {
  placeholder: '',
  readOnly: true
};

// 组件销毁时，也及时销毁编辑器，重要！
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;

  editor.destroy();
});

// 编辑器回调函数
const handleCreated = (editor) => {
  // console.log('created', editor);
  editorRef.value = editor; // 记录 editor 实例，重要！

};
const handleChange = (editor) => {
  // console.log('change:', editor.getHtml());
};
const handleDestroyed = (editor) => {
  // console.log('destroyed', editor);
};
const handleFocus = (editor) => {
  // console.log('focus', editor);
};
const handleBlur = (editor) => {
  // console.log('blur', editor);
};
const customAlert = (info, type) => {
  // alert(`【自定义提示】${type} - ${info}`);
};
const customPaste = (editor, event, callback) => {
  console.log('ClipboardEvent 粘贴事件对象', event);

  // 自定义插入内容
  // editor.insertText('xxx');

  // 返回值（注意，vue 事件的返回值，不能用 return）
  // callback(false); // 返回 false ，阻止默认粘贴行为
  callback(true) // 返回 true ，继续默认的粘贴行为
};

const insertText = () => {
  const editor = editorRef.value;
  if (editor == null) return;

  editor.insertText('hello world');
};

const printHtml = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  console.log(editor.getHtml());
};


const editOrPreview=() => {
  if(editStatus.value===true){
    disableEdit();
  }else{
    enableEdit();
  }
}


const disableEdit = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.disable();
  console.log(editStatus.value);
  editStatus.value = !editStatus.value;
  console.log(editStatus.value);

  ElMessage({
    message: '已禁用编辑！',
    type: 'success',
    plain: true,
  })
};

const enableEdit = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  if (editor.isDisabled()) {
    editor.enable();
    console.log(editStatus.value);
    editStatus.value = !editStatus.value;
    console.log(editStatus.value);
  }

  ElMessage({
    message: '已开启编辑！',
    type: 'success',
    plain: true,
  })

};

const delNote = () => {
  deleteNoteItem(noteData.value.noteId).then((res) => {
    if (res = "ok") {
      ElMessage({
        message: '删除成功！',
        type: 'success',
        plain: true,
      })
      // 修改参数
      router.push(`/note`);
      noteData.value.noteId = res.id;
    }
  });

};

const saveNote = () => {

  const editor = editorRef.value;
  var noteValue = editor.getHtml();
  var title = noteValue.length > 20 ? noteValue.substring(0, 20) : noteValue

  // 加密
  noteValue = cipherText(noteValue)
  if (noteData.value.noteId == -1) {
    // 添加操作
    addNote(null, noteValue, title,noteData.value.groupId).then((res) => {
      if (res.code = 200) {
        ElMessage({
          message: '保存成功！',
          type: 'success',
          plain: true,
        })
        // 修改路由参数
        if(res.data){
        router.replace(`/noteDetail/${res.data}`);
        noteData.value.noteId = res.data;
        }else{
          alert("保存出错...")
        }
      }
    });
  } else {
    // 修改操作
    editNote(noteData.value.noteId, noteValue, title,noteData.value.groupId).then((res) => {
      if (res = "ok") {
        ElMessage({
          message: '保存成功！',
          type: 'success',
          plain: true,
        })
      }
    });
  }
};

</script>

<style>
.edit-button-box {
  margin-left: 5px;
  margin-top: 2px;
  height: 37px;
  /* 修正了多余的 px */
  display: flex;
  justify-content: flex-start;
  /* 子元素靠左排列 */
  align-items: center;
  /* 让所有子元素垂直居中 */
  flex-wrap: nowrap;

}

/* wangeditor 最小高度300 */
.w-e-scroll {
    min-height: 300px;
}

</style>