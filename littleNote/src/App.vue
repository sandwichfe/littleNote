<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import Cookies from 'js-cookie'
import { handleAuthCallback } from '@/utils/auth'

onMounted(async () => {
  // 处理Portal登录回跳，提取授权码并换取token
  await handleAuthCallback()
})

onUnmounted(() => {
})
</script>

<template>
    <RouterView />
</template>

<style>

* {
  margin: 0;
  padding: 0;
}

/* 屏蔽chrome浏览器默认项输入框背景色 */
input:-internal-autofill-previewed,
input:-internal-autofill-selected {
    transition: background-color 999999999s !important;
}

</style>