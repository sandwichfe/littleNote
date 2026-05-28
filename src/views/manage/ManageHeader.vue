<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import UserAvatarDropdown from '@/components/UserAvatarDropdown.vue'
import { HomeFilled, Brush } from '@element-plus/icons-vue'
import { useThemeStore } from '@/store/theme'

const router = useRouter()
const themeStore = useThemeStore()

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
      <el-popover placement="bottom-end" :width="260" trigger="click" :teleported="false" popper-style="overflow: visible;">
        <template #reference>
          <el-button circle>
            <el-icon><Brush /></el-icon>
          </el-button>
        </template>
        <div class="theme-panel">
          <div class="theme-panel__title">主题设置</div>
          <div class="theme-panel__item">
            <span>主题色</span>
            <el-color-picker v-model="themeStore.accent" size="small" :teleported="false"
              @active-change="(v: string) => { themeStore.accent = v }"
              @change="themeStore.save()" />
          </div>
          <div class="theme-panel__item">
            <span>文字色</span>
            <el-color-picker v-model="themeStore.textColor" size="small" :teleported="false"
              @active-change="(v: string) => { themeStore.textColor = v }"
              @change="themeStore.save()" />
          </div>
          <div class="theme-panel__item">
            <span>背景色</span>
            <el-color-picker v-model="themeStore.bgColor" size="small" :teleported="false"
              @active-change="(v: string) => { themeStore.bgColor = v }"
              @change="themeStore.save()" />
          </div>
          <el-button size="small" @click="themeStore.reset()" style="width:100%;margin-top:12px">
            恢复默认
          </el-button>
        </div>
      </el-popover>

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
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #DB2777 0%, #CA8A04 100%);
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
  color: var(--manage-slate, #831843);
  line-height: 1.2;
}

.brand-tag {
  font-size: 11px;
  color: var(--manage-muted, #9D7A8A);
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
  background: var(--manage-border, rgba(219, 39, 119, 0.12));
}

.user-area {
  display: flex;
  align-items: center;
}

:deep(.el-button.is-circle) {
  border-color: var(--manage-border, rgba(219, 39, 119, 0.12));
  color: var(--manage-muted, #9D7A8A);
}

:deep(.el-button.is-circle:hover) {
  color: var(--manage-accent, #CA8A04);
  border-color: var(--manage-accent, #CA8A04);
  background-color: var(--manage-accent-soft, rgba(202, 138, 4, 0.05));
}

.theme-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--manage-slate, #831843);
  margin-bottom: 14px;
}

.theme-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: var(--manage-slate, #831843);
}

:deep(.el-color-picker__panel) {
  z-index: 9999 !important;
}
</style>
