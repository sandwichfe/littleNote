<template>
    <div style="height: 100%;" >
      <!-- <div>
        <button @click="insertText">insert text</button>
        <button @click="printHtml">print html</button>
      </div> -->
      <el-button @click="disableEdit" :disabled="!editStatus">disable</el-button>
      <el-button @click="enableEdit" :disabled="editStatus">enable</el-button>
      <el-button @click="saveNote" plain type="primary">save</el-button>
    

      <el-popconfirm title="确定删除吗?" @confirm="delNote">
        <template #reference>
          <el-button plain  type="danger" >delete</el-button>
        </template>
      </el-popconfirm>


      <div style="border: 1px solid #ccc; margin-top: 10px; ">
        <Toolbar
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
          style="border-bottom: 1px solid #ccc"
        />
        <Editor
          :defaultConfig="editorConfig"
          :mode="mode"
          v-model="valueHtml"
          style="overflow-y: hidden"
          @onCreated="handleCreated"
          @onChange="handleChange"
          @onDestroyed="handleDestroyed"
          @onFocus="handleFocus"
          @onBlur="handleBlur"
          @customAlert="customAlert"
          @customPaste="customPaste"
        />
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
  
  <script>
  import '@wangeditor/editor/dist/css/style.css';
  import { onBeforeUnmount, ref, toRefs ,reactive,shallowRef, onMounted } from 'vue';
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
  import { getNote,editNote,addNote,deleteNoteItem } from "@/network/base"; 
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus'
  import {cipherText,decrypted} from "@/utils/aesUtil"; 
  import { openLoading,closeLoading } from "@/utils/loadingUtil";

  export default {
    components: { Editor, Toolbar },
    
  props: {
     //这里是编辑时候父组件传递的值：newEdit是编辑的数据；
    newEdit: {
      type: String,
      default:""
    },
    // isEdit:用来判断是不是编辑
    isEdit: {
      type: Boolean,
      default:false
    },
    noteId: {
      type: String,
      default:'0'
    },
  },

  computed: {
  },


    setup(props, context) {

         //定义数据接收父组件传递的数据。注意这里最好是定义变量来接收再使用，不然容易报错。
    const noteData = reactive({
      isEdit: props.isEdit ? props.isEdit : false,
      noteId: props.noteId ,
    });

    const router = useRouter()

    // 默认不可编辑
    const editStatus = ref(false);



      // 编辑器实例，必须用 shallowRef，重要！
      const editorRef = shallowRef();
  
      
      // 内容 HTML
      const valueHtml = ref("");
  
    

      // 模拟 ajax 异步获取内容
      onMounted(() => {

       
        var paramId = router.currentRoute.value.params.id;
        if(paramId==-1){
          return;
        }
        getNote(paramId).then((res) => {
          // console.log(res)
          if(res.content==null){
            res.content = ''
          }
          valueHtml.value = decrypted(res.content);
        });

      });
  
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
        console.log('created', editor);
        editorRef.value = editor; // 记录 editor 实例，重要！
      };
      const handleChange = (editor) => {
        console.log('change:', editor.getHtml());
      };
      const handleDestroyed = (editor) => {
        console.log('destroyed', editor);
      };
      const handleFocus = (editor) => {
        console.log('focus', editor);
      };
      const handleBlur = (editor) => {
        console.log('blur', editor);
      };
      const customAlert = (info, type) => {
        alert(`【自定义提示】${type} - ${info}`);
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
        if(editor.isDisabled()){
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
        deleteNoteItem(noteData.noteId).then((res) => {
          if(res="ok"){
                ElMessage({
                message: '删除成功！',
                type: 'success',
                plain: true,
              })
              // 修改参数
              router.push(`/note`);
              noteData.noteId = res.id;
              }
            });

      };



      
      const saveNote = () => {
        const editor = editorRef.value;

        var noteValue = editor.getHtml();
        var title = noteValue.length > 20 ? noteValue.substring(0, 20) : noteValue  

        // 加密
        noteValue = cipherText(noteValue)

          if(noteData.noteId==-1){
            // 添加操作
              addNote(null,noteValue,title).then((res) => {
              if(res.code=200){
                ElMessage({
                message: '保存成功！',
                type: 'success',
                plain: true,
              })
              // 修改参数
              router.replace(`/noteDetail/${res.id}`);
              noteData.noteId = res.id;
              }
            });

            
          }else{
            // 修改操作
            editNote(noteData.noteId,noteValue,title).then((res) => {
          if(res="ok"){
            ElMessage({
            message: '保存成功！',
            type: 'success',
            plain: true,
          })
          }
        });

        }


          


    

        
      };




  
      return {
        editorRef,
        mode: 'default',
        valueHtml,
        toolbarConfig,
        editorConfig,
        handleCreated,
        handleChange,
        handleDestroyed,
        handleFocus,
        handleBlur,
        customAlert,
        customPaste,
        insertText,
        printHtml,
        disableEdit,
        enableEdit,
        editStatus,
        saveNote,
        noteData,
        router,
        delNote
      };


    },

    methods:{
        a(){
          const editor = this.editorRef.value;
        if (editor == null) return;
        editor.disable()
        }


    }






  };
  </script>

<style>
    .w-e-text-container{
        height: 850px !important;/*!important是重点，因为原div是行内样式设置的高度300px*/
    }

</style>
  