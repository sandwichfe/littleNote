<template>
  <div id="app" style=" overflow: hidden;">
    <editor  :isEdit="isEdit"  :noteId="noteId" style="background: #fff;"></editor>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import editor from '../components/editor.vue';
import { useRouter } from 'vue-router';
import { openLoading,closeLoading } from "@/utils/loadingUtil";

export default {
  name: 'noteDetail',
  components: {
    // HelloWorld
    editor,
  },

  data() {
    return {
      newEdit:"12312dsads4",
      isEdit:true,
      noteId:0
    };
  },


  
mounted() {
    //  监听快捷键按下
    window.addEventListener('keydown', this.handleEvent)

},

created(){
  const router = useRouter()
  var paramId = router.currentRoute.value.params.id;
  this.noteId = paramId;

  // 关闭loading
  closeLoading();

},

beforeDestroy() {
   // 在页面销毁的时候记得解除监听
    window.removeEventListener('keydown', this.handleEvent)
},

methods:{
    async handleEvent(event) {
      switch (event.keyCode) {
        case 83:
          console.log('ctrl + s')
          event.preventDefault()
          event.returnValue = false // 阻止直接保存网页
          break
      }
    },


}




};
</script>

<style></style>
