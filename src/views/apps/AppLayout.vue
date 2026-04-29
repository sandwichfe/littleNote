<script setup>
import GlobalHeader from '@/components/layout/GlobalHeader.vue'
</script>

<template>
  <div class="app-layout">
    <GlobalHeader />

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(13, 148, 136, 0.07), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.app-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
