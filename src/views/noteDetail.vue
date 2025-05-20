<template>
  <div id="app">
    <!-- 使用绑定的 noteData 传递给 editor 组件 -->
    <Editor :initNoteData="noteData" class="full-height-editor"></Editor>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'; // 引入 Vue 3 的 Composition API
import { useRouter } from 'vue-router';
import Editor from '../components/editor.vue'; // 引入 editor 组件
import { openLoading, closeLoading } from "@/utils/loadingUtil";

// 将数据包装到一个对象中，以便作为 noteData 传递
const noteData = ref({
  newEdit: " ",
  isEdit: true,
  noteId: 0
});

// 使用 Vue Router 获取参数
const router = useRouter();

onMounted(() => {
    // 获取路由参数
    const paramId = router.currentRoute.value.params.id;
    // 设置 noteId
    noteData.value.noteId = Number(paramId);
    // 关闭 loading
    closeLoading();
    // 监听键盘事件
    window.addEventListener('keydown', handleEvent);
});

// 在组件销毁前解绑事件
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEvent);
});

// 键盘事件处理函数
function handleEvent(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === 's') { // 检测 Ctrl + S 键
    console.log('ctrl + s');
    event.preventDefault(); // 阻止默认行为，防止直接保存网页
  }
}

</script>

<style scoped>
#app {
  height: 100vh; /* 使 #app 占据整个视口高度 */
  display: flex; /* 使用 flex 布局，方便子元素填充 */
  flex-direction: column; /* 列方向排列 */
  overflow: hidden; /* 防止 #app 自身出现滚动条 */
}

/* 编辑器组件的样式 */
.full-height-editor {
  flex-grow: 1; /* 使编辑器组件填充剩余空间 */
  background: #fff; /* 保留原有的背景色 */
  overflow: hidden; /* 编辑器组件应管理其内部滚动 */
}
</style>
