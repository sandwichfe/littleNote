<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import UserAvatarDropdown from '@/components/UserAvatarDropdown.vue'
import { getActiveModuleKey, moduleNavigationItems } from '@/config/moduleNavigation'

const route = useRoute()
const router = useRouter()

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
      >
        <button class="module-trigger" type="button" aria-label="module switcher">
          <span class="module-trigger-value">{{ activeModuleItem.label }}</span>
          <el-icon class="module-trigger-icon">
            <ArrowDown />
          </el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in moduleNavigationItems"
              :key="item.key"
              :command="item.route"
              class="module-entry"
              :class="{ 'is-active': activeModule === item.key }"
            >
              <div class="module-entry-content">
                <div class="module-entry-copy">
                  <span class="module-entry-title">{{ item.label }}</span>
                  <span class="module-entry-description">{{ item.description }}</span>
                </div>
                <span v-if="activeModule === item.key" class="module-entry-badge">Current</span>
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
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--header-border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--header-text);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.module-trigger:hover {
  border-color: rgba(13, 148, 136, 0.24);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.module-trigger-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--header-subtle);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.module-trigger-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-accent);
}

.module-trigger-icon {
  font-size: 14px;
  color: var(--header-subtle);
}

:deep(.module-dropdown-popper) {
  padding: 8px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
}

:deep(.module-dropdown-popper .el-dropdown-menu) {
  padding: 0;
  border: none;
}

:deep(.module-dropdown-popper .el-dropdown-menu__item) {
  padding: 0;
  background: transparent;
}

:deep(.module-dropdown-popper .el-dropdown-menu__item:not(.is-disabled):focus) {
  background: transparent;
}

.module-entry-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 14px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.module-entry-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.module-entry-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-text);
}

.module-entry-description {
  font-size: 12px;
  color: var(--header-subtle);
}

.module-entry-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid var(--header-border);
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.1);
  color: var(--header-accent);
  font-size: 11px;
  font-weight: 700;
}

.module-entry:hover .module-entry-content {
  background: #f8fafc;
}

.module-entry.is-active .module-entry-content {
  background: linear-gradient(135deg, rgba(236, 253, 250, 0.96), rgba(240, 253, 250, 0.96));
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
    min-height: 34px;
    padding: 0 12px;
  }

  .module-trigger-label {
    display: none;
  }

  .module-entry-content {
    min-width: 200px;
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
    min-width: 176px;
    gap: 12px;
  }
}
</style>
