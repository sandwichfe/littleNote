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
          <el-button circle class="theme-trigger" aria-label="主题设置">
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
          <el-button size="small" class="theme-panel__reset" @click="themeStore.reset()">
            恢复默认
          </el-button>
        </div>
      </el-popover>

      <div class="divider" aria-hidden="true"></div>

      <div v-if="hasToken">
        <el-button type="danger" size="small" class="header-action" @click="logout">
          退出登录
        </el-button>
      </div>
      <el-button v-else type="primary" size="small" class="header-action" @click="router.push('/login')">
        登录管理
      </el-button>
    </div>
  </header>
</template>

<style scoped>
/* Apple 极简顶栏：白底 + 底部分割线，无玻璃态 */
.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
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
  transition: opacity 0.15s ease;
}

.brand-group:hover {
  opacity: 0.72;
}

/* 品牌色块：实心主色，无渐变 */
.brand-logo {
  padding: 6px 12px;
  background: var(--manage-accent, #0071e3);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-tag {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.25;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
}

:deep(.theme-trigger.el-button.is-circle) {
  border-color: #e5e7eb;
  color: #6b7280;
  background: #ffffff;
  width: 32px;
  height: 32px;
}

:deep(.theme-trigger.el-button.is-circle:hover) {
  color: var(--manage-accent, #0071e3);
  border-color: #d1d5db;
  background-color: #f3f4f6;
}

/* 操作按钮圆角收敛到 6px */
:deep(.header-action.el-button) {
  border-radius: 6px;
  font-weight: 500;
}

.theme-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
  line-height: 1.25;
}

.theme-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: #111827;
}

.theme-panel__reset {
  width: 100%;
  margin-top: 12px;
  border-radius: 6px;
}

:deep(.el-color-picker__panel) {
  z-index: 9999 !important;
}
</style>
