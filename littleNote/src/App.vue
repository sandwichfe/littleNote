<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import Cookies from 'js-cookie'

onMounted(() => {
  // 接收从Portal传来的token
  const urlParams = new URLSearchParams(window.location.search)
  const tokenFromUrl = urlParams.get('token')

  if (tokenFromUrl) {
    Cookies.set('loginToken', tokenFromUrl, { expires: 7 })
    // 清理URL中的token参数
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
  }
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