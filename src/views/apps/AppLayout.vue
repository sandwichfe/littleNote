<script setup>
import { useRouter } from 'vue-router'
import UserAvatarDropdown from '@/components/UserAvatarDropdown.vue'

const router = useRouter()
</script>

<template>
  <div class="app-layout">
    <!-- 顶部 Header -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo" @click="router.push('/note')">
          <span class="logo-text">LittleNote</span>
        </div>
      </div>

      <div class="header-right">
        <!-- 用户信息 -->
        <UserAvatarDropdown />
      </div>
    </header>

    <!-- 内容区域 -->
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
  background-color: #f0f2f5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: #fff;
  position: relative;
  z-index: 100;
  border-bottom: 1px solid #e0e0e0;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  color: #44474770;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-content {
  flex: 1;
  overflow: auto;
  background-color: #f0f2f5;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .app-header {
    padding: 0 15px;
    height: 56px;
  }

  .logo-text {
    font-size: 20px;
  }
}
</style>
