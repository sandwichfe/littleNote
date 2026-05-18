<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import UserAvatarDropdown from '@/components/UserAvatarDropdown.vue'
import { HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

const hasToken = computed(() => {
  return Boolean(Cookies.get('loginToken'))
})

const goHome = () => {
  router.push('/note')
}

const goManage = () => {
  router.push('/manage')
}
</script>

<template>
  <header class="manage-header">
    <div class="header-left">
      <div class="brand-group" @click="goManage">
        <div class="brand-logo">LN</div>
        <div class="brand-info">
          <span class="brand-title">LittleNote</span>
          <span class="brand-tag">管理控制台</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <el-tooltip content="返回前台" placement="bottom">
        <el-button circle @click="goHome">
          <el-icon><HomeFilled /></el-icon>
        </el-button>
      </el-tooltip>
      
      <div class="divider"></div>
      
      <div v-if="hasToken" class="user-area">
        <UserAvatarDropdown />
      </div>
      <el-button v-else type="primary" size="small" @click="router.push('/manage/login')">
        登录管理
      </el-button>
    </div>
  </header>
</template>

<style scoped>
.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.brand-group:hover {
  opacity: 0.8;
}

.brand-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #0da49a 0%, #0f766e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: bold;
  font-size: 14px;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.brand-tag {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}

.user-area {
  display: flex;
  align-items: center;
}

:deep(.el-button.is-circle) {
  border-color: #e2e8f0;
  color: #64748b;
}

:deep(.el-button.is-circle:hover) {
  color: #0da49a;
  border-color: #0da49a;
  background-color: rgba(13, 164, 154, 0.05);
}
</style>
