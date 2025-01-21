<template>
  <div id="app" style="overflow: hidden;">
    <!-- 使用绑定的 noteData 传递给 editor 组件 -->
    <Editor :initNoteData="noteData" style="background: #fff;"></Editor>
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
/* 可在此添加样式 */
</style>
