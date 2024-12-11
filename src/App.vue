<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>

  <RouterView />
</template>

<style >
* {
        margin: 0;
        padding: 0;
    }

    #app {
      margin-left: auto;
        width: 100%;
        height: 100%;
    }
    /*清除点击时的高亮颜色*/
    a,
    input,
    button,
    div {
     -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }
    /*清除ios下的默认圆角*/
input,
button {
  -webkit-appearance: none;
  border-radius: 0;
}
body {
  -webkit-text-size-adjust: 100%;/*禁止文字缩放*/
}
body * {
  font-family: helvetica; /*默认字体设置*/
}
</style>
