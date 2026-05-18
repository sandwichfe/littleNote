<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowDown, ArrowRight, Document, Select, Setting, Menu, Check } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import UserAvatarDropdown from '@/components/UserAvatarDropdown.vue'
import { getActiveModuleKey, moduleNavigationItems } from '@/config/moduleNavigation'

const route = useRoute()
const router = useRouter()

const isDropdownVisible = ref(false)

const handleDropdownVisibleChange = (visible: boolean) => {
  isDropdownVisible.value = visible
}

const activeModule = computed(() => getActiveModuleKey(route.path))
const activeModuleItem = computed(() => (
  moduleNavigationItems.find(item => item.key === activeModule.value) ?? moduleNavigationItems[0]
))

const hasToken = computed(() => {
  void route.fullPath
  return Boolean(Cookies.get('loginToken'))
})

const goHome = () => {
  router.push('/note')
}

const goToModule = (targetPath: string) => {
  if (route.path === targetPath) {
    return
  }

  router.push(targetPath)
}
</script>

<template>
  <header class="global-header">
    <div class="header-left">
      <button class="brand-button" type="button" @click="goHome">
        <span class="brand-title">LittleNote</span>
      </button>

      <el-dropdown
        trigger="click"
        placement="bottom-start"
        popper-class="module-dropdown-popper"
        @command="goToModule"
        @visible-change="handleDropdownVisibleChange"
      >
        <button 
          class="module-trigger" 
          type="button" 
          aria-label="module switcher"
          :class="{ 'is-active': isDropdownVisible }"
        >
          <div class="module-trigger-inner">
            <span class="module-trigger-value">{{ activeModuleItem.label }}</span>
            <span class="module-trigger-divider"></span>
            <span class="module-trigger-desc">{{ activeModuleItem.description }}</span>
          </div>
          <el-icon class="module-trigger-icon" :class="{ 'is-rotated': isDropdownVisible }">
            <ArrowDown />
          </el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu class="module-dropdown-menu">
            <el-dropdown-item
              v-for="item in moduleNavigationItems"
              :key="item.key"
              :command="item.route"
              class="module-entry"
              :class="{ 'is-active': activeModule === item.key }"
            >
              <div class="module-entry-content">
                <div class="module-entry-icon" :class="`icon-${item.key}`">
                  <el-icon v-if="item.key === 'note'"><Document /></el-icon>
                  <el-icon v-else-if="item.key === 'todo'"><Select /></el-icon>
                  <el-icon v-else-if="item.key === 'manage'"><Setting /></el-icon>
                  <el-icon v-else><Menu /></el-icon>
                </div>
                <div class="module-entry-copy">
                  <span class="module-entry-title">{{ item.label }}</span>
                  <span class="module-entry-description">{{ item.description }}</span>
                </div>
                <div class="module-entry-action">
                  <el-icon v-if="activeModule === item.key" class="check-icon"><Check /></el-icon>
                  <el-icon v-else class="arrow-icon"><ArrowRight /></el-icon>
                </div>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="header-right">
      <el-button v-if="!hasToken" type="primary" plain class="login-button" @click="router.push('/login')">
        Login
      </el-button>
      <UserAvatarDropdown v-else />
    </div>
  </header>
</template>

<style scoped>
.global-header {
  --header-accent: #0d9488;
  --header-border: #e2e8f0;
  --header-text: #0f172a;
  --header-subtle: #64748b;
  --header-surface: rgba(255, 255, 255, 0.96);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 64px;
  padding: 0 18px;
  background: var(--header-surface);
  border-bottom: 1px solid var(--header-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.brand-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dff7f4 0%, #f0fdfa 100%);
  color: var(--header-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border: 1px solid rgba(13, 148, 136, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.brand-button:hover .brand-mark {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(13, 148, 136, 0.12);
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--header-text);
}

.module-trigger {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--header-border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--header-text);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-trigger:hover, .module-trigger.is-active {
  border-color: rgba(13, 148, 136, 0.3);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08);
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.module-trigger.is-active {
  transform: translateY(1px);
}

.module-trigger-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-trigger-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--header-text);
}

.module-trigger-divider {
  width: 1px;
  height: 12px;
  background-color: var(--header-border);
}

.module-trigger-desc {
  font-size: 13px;
  color: var(--header-subtle);
  font-weight: 500;
}

.module-trigger-icon {
  font-size: 14px;
  color: var(--header-subtle);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-trigger-icon.is-rotated {
  transform: rotate(-180deg);
  color: var(--header-accent);
}

:deep(.module-dropdown-popper) {
  padding: 6px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.15);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

:deep(.module-dropdown-popper .el-dropdown-menu) {
  padding: 0;
  border: none;
  background: transparent;
}

:deep(.module-dropdown-popper .el-dropdown-menu__item) {
  padding: 4px;
  background: transparent;
}

:deep(.module-dropdown-popper .el-dropdown-menu__item:not(.is-disabled):focus) {
  background: transparent;
}

.module-entry-content {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 260px;
  padding: 12px 16px;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  border: 1px solid transparent;
}

.module-entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f1f5f9;
  color: var(--header-subtle);
  font-size: 20px;
  transition: all 0.25s ease;
}

.module-entry:hover .module-entry-icon {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.module-entry.is-active .module-entry-icon {
  background: linear-gradient(135deg, var(--header-accent) 0%, #0f766e 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
}

.module-entry-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.module-entry-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--header-text);
  line-height: 1.2;
}

.module-entry-description {
  font-size: 13px;
  color: var(--header-subtle);
  line-height: 1.2;
}

.module-entry-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.25s ease;
}

.arrow-icon {
  font-size: 14px;
  color: var(--header-subtle);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.check-icon {
  font-size: 16px;
  color: var(--header-accent);
}

.module-entry:hover .arrow-icon {
  opacity: 1;
  transform: translateX(0);
  color: var(--header-accent);
}

.module-entry:hover .module-entry-content {
  background: #f8fafc;
  border-color: rgba(226, 232, 240, 0.6);
}

.module-entry.is-active .module-entry-content {
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.8), rgba(204, 251, 241, 0.4));
  border-color: rgba(13, 148, 136, 0.15);
}

.module-entry.is-active .module-entry-title {
  color: var(--header-accent);
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.login-button {
  border-radius: 999px;
  border-color: rgba(13, 148, 136, 0.24);
  color: var(--header-accent);
}

@media (max-width: 960px) {
  .global-header {
    padding: 0 14px;
  }

  .header-left {
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .global-header {
    min-height: 56px;
    padding: 8px 12px;
    gap: 10px;
  }

  .header-left {
    gap: 8px;
  }

  .brand-mark {
    width: 30px;
    height: 30px;
    border-radius: 10px;
  }

  .brand-title {
    font-size: 16px;
  }

  .module-trigger {
    min-height: 36px;
    padding: 0 12px;
    gap: 8px;
  }

  .module-trigger-divider,
  .module-trigger-desc {
    display: none;
  }

  .module-entry-content {
    min-width: 220px;
    padding: 10px 12px;
  }
  
  .module-entry-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

@media (max-width: 560px) {
  .brand-title {
    display: none;
  }

  .module-trigger {
    padding: 0 10px;
  }

  .module-entry-content {
    min-width: 190px;
    gap: 12px;
  }
}
</style>
