<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useLoveEffect } from '@/utils/love.js'

const { start, stop } = useLoveEffect()

onMounted(() => {
  // 爱心特效
  start()
})

onUnmounted(() => {
  // 移除爱心特效
  stop()
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