<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

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
