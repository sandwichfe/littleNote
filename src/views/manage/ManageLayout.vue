<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalHeader from '@/components/layout/GlobalHeader.vue'
import { useMenuStore } from '@/store/menu'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()

const activeTab = ref(route.path)
const tabs = ref([])
const menuData = menuStore.menuData
const isMobileMenuVisible = ref(false)
const isMobile = ref(false)

const getTabLabel = (path) => {
  const resolved = router.resolve(path)
  const title = resolved.meta?.title

  if (typeof title === 'string' && title.length > 0) {
    return title
  }

  if (typeof resolved.name === 'string' && resolved.name.length > 0) {
    return resolved.name
  }

  return path.split('/').filter(Boolean).at(-1) || 'Manage'
}

const ensureTab = (path) => {
  if (path === '/manage') {
    return
  }

  if (!tabs.value.some(tab => tab.name === path)) {
    tabs.value.push({
      name: path,
      label: getTabLabel(path)
    })
  }
}

const handleSelect = (index) => {
  router.push(index)

  if (isMobile.value) {
    isMobileMenuVisible.value = false
  }
}

const handleTabRemove = (tabName) => {
  const index = tabs.value.findIndex(tab => tab.name === tabName)
  if (index === -1) {
    return
  }

  tabs.value.splice(index, 1)

  if (activeTab.value !== tabName) {
    return
  }

  const fallbackTab = tabs.value[index] || tabs.value[index - 1]
  const targetPath = fallbackTab?.name || '/manage/user'

  activeTab.value = targetPath
  router.push(targetPath)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const toggleMobileMenu = () => {
  isMobileMenuVisible.value = !isMobileMenuVisible.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/login') {
      return
    }

    activeTab.value = newPath
    ensureTab(newPath)
  },
  { immediate: true }
)

watch(activeTab, (newTab) => {
  if (newTab !== route.path) {
    router.push(newTab)
  }
})
</script>

<template>
  <div class="manage-layout">
    <GlobalHeader />

    <div class="manage-body">
      <div v-if="isMobile" class="hamburger" @click="toggleMobileMenu">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </div>

      <aside class="menu" :class="{ 'mobile-menu-visible': isMobileMenuVisible }">
        <el-menu :default-active="route.path" class="el-menu-vertical" @select="handleSelect">
          <template v-for="menu in menuData" :key="menu.id">
            <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path || menu.name">
              <template #title>{{ menu.title }}</template>
              <template v-for="subMenu in menu.children" :key="subMenu.id">
                <el-menu-item :index="`/manage${subMenu.path}`">{{ subMenu.title }}</el-menu-item>
              </template>
            </el-sub-menu>
            <el-menu-item v-else :index="`/manage${menu.path}`">{{ menu.title }}</el-menu-item>
          </template>
        </el-menu>
      </aside>

      <div class="right-content" @click="isMobileMenuVisible = false">
        <div class="content">
          <div class="tabs-shell">
            <el-tabs v-model="activeTab" type="card" closable @tab-remove="handleTabRemove">
              <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
            </el-tabs>

            <div class="tab-panel">
              <RouterView />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(13, 148, 136, 0.08), transparent 24%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.manage-body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
}

.menu {
  width: 220px;
  background-color: #ffffff;
  transition: transform 0.3s ease, width 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  border-right: 1px solid #e8e8e8;
}

.el-menu-vertical {
  border-right: none;
}

.el-menu-item,
.el-sub-menu__title {
  transition: background-color 0.3s ease, color 0.3s ease;
  border-radius: 10px;
  margin: 6px 8px;
}

.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #ecfeff;
  color: #0f766e;
}

.el-menu-item.is-active {
  background-color: #0d9488;
  color: #fff;
}

.el-menu-item.is-active:hover {
  background-color: #0f766e;
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.content {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow: hidden;
}

.tabs-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.content :deep(.el-tabs) {
  flex-shrink: 0;
}

.content :deep(.el-tabs__content) {
  display: none;
}

.el-tabs--card > .el-tabs__header {
  border-bottom: 1px solid #dcdfe6;
  margin-bottom: 0;
  background-color: #ffffff;
  border-radius: 10px 10px 0 0;
  padding: 6px 6px 0;
}

.el-tabs--card > .el-tabs__header .el-tabs__nav {
  border: none;
  border-radius: 0;
}

.el-tabs--card > .el-tabs__header .el-tabs__item {
  border: 1px solid transparent;
  border-bottom: none;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  margin-right: 6px;
  background-color: transparent;
  color: #606266;
  border-radius: 8px 8px 0 0;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  font-weight: 500;
}

.el-tabs--card > .el-tabs__header .el-tabs__item:hover {
  color: #0d9488;
  background-color: #f0fdfa;
}

.el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
  background-color: #ffffff;
  color: #0d9488;
  border-color: #dcdfe6 #dcdfe6 #ffffff;
  border-bottom: 1px solid #ffffff;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.tab-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.hamburger {
  position: fixed;
  top: 72px;
  left: 15px;
  z-index: 1001;
  padding: 8px;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.hamburger:hover {
  background: rgba(240, 240, 240, 0.95);
}

@media (max-width: 768px) {
  .menu {
    position: fixed;
    left: 0;
    top: 56px;
    height: calc(100vh - 56px);
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    width: 250px;
  }

  .menu.mobile-menu-visible {
    transform: translateX(0);
  }

  .right-content {
    width: 100%;
  }

  .content {
    padding: 15px;
  }

  .el-tabs--card > .el-tabs__header .el-tabs__item {
    padding: 0 10px;
    font-size: 13px;
    height: 36px;
    line-height: 36px;
  }

  .tab-panel {
    padding: 14px;
  }

  .hamburger {
    top: 68px;
  }
}
</style>
