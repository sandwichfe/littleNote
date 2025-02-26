<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
.app-container {
  display: flex;
  height: 100vh;
}

* {
  margin: 0;
  padding: 0;
}

#app {
  margin-left: auto;
  width: 100%;
  height: 100%;
}
</style>