<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { Brush } from '@element-plus/icons-vue'
import { useThemeStore } from '@/store/theme'

const router = useRouter()
const themeStore = useThemeStore()

const hasToken = computed(() => {
  return Boolean(Cookies.get('loginToken'))
})

const goManage = () => {
  router.push('/')
}

const logout = () => {
  Cookies.remove('loginToken')
  router.push('/login')
}
</script>

<template>
  <header class="manage-header">
    <div class="header-left">
      <div class="brand-group" @click="goManage">
        <div class="brand-logo">数据中台</div>
        <div class="brand-info">
          <span class="brand-tag">管理控制台</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <el-popover
        placement="bottom-end"
        :width="260"
        trigger="click"
        :teleported="false"
        popper-style="overflow: visible;"
      >
        <template #reference>
          <el-button circle>
            <el-icon><Brush /></el-icon>
          </el-button>
        </template>
        <div class="theme-panel">
          <div class="theme-panel__title">主题设置</div>
          <div class="theme-panel__item">
            <span>主题色</span>
            <el-color-picker
              v-model="themeStore.accent"
              size="small"
              :teleported="false"
              @active-change="(v: string) => { themeStore.accent = v }"
              @change="themeStore.save()"
            />
          </div>
          <div class="theme-panel__item">
            <span>文字色</span>
            <el-color-picker
              v-model="themeStore.textColor"
              size="small"
              :teleported="false"
              @active-change="(v: string) => { themeStore.textColor = v }"
              @change="themeStore.save()"
            />
          </div>
          <div class="theme-panel__item">
            <span>背景色</span>
            <el-color-picker
              v-model="themeStore.bgColor"
              size="small"
              :teleported="false"
              @active-change="(v: string) => { themeStore.bgColor = v }"
              @change="themeStore.save()"
            />
          </div>
          <el-button size="small" @click="themeStore.reset()" style="width:100%;margin-top:12px">
            恢复默认
          </el-button>
        </div>
      </el-popover>

      <div class="divider"></div>

      <div v-if="hasToken">
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
      <el-button v-else type="primary" size="small" @click="router.push('/login')">
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: none;
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
  padding: 8px 16px;
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

.brand-tag {
  font-size: 12px;
  color: var(--manage-muted, #64748b);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--manage-border, rgba(13, 164, 154, 0.12));
}

:deep(.el-button.is-circle) {
  border-color: var(--manage-border, rgba(13, 164, 154, 0.12));
  color: var(--manage-muted, #64748b);
}

:deep(.el-button.is-circle:hover) {
  color: var(--manage-accent, #0da49a);
  border-color: var(--manage-accent, #0da49a);
  background-color: var(--manage-accent-soft, rgba(13, 164, 154, 0.05));
}

.theme-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--manage-slate, #0f766e);
  margin-bottom: 14px;
}

.theme-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: var(--manage-slate, #0f766e);
}

:deep(.el-color-picker__panel) {
  z-index: 9999 !important;
}
</style>
