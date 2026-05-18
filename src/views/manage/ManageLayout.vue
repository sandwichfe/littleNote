<script setup>
import './manage-theme.css'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Grid,
  Operation,
  Fold,
  Expand
} from '@element-plus/icons-vue'
import ManageHeader from './ManageHeader.vue'
import { useMenuStore } from '@/store/menu'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()

const activeTab = ref(route.path)
const tabs = ref([])
const menuData = computed(() => menuStore.menuData)
const isMobileMenuVisible = ref(false)
const isMobile = ref(false)
const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const normalizeManagePath = (path = '') => {
  if (!path) {
    return '/manage'
  }

  if (path.startsWith('/manage')) {
    return path
  }

  return `/manage${path.startsWith('/') ? path : `/${path}`}`
}

const getPageMeta = (path, fallbackTitle = '') => ({
  title: fallbackTitle || '管理中心',
  eyebrow: 'Workspace',
  description: '统一管理账号、角色、菜单与组织结构，保持后台信息简洁有序。',
  icon: Grid
})

const getTabLabel = (path) => {
  const findTitle = (menus, targetPath) => {
    for (const m of menus) {
      if (normalizeManagePath(m.path) === targetPath) return m.title || m.name
      if (m.children) {
        const found = findTitle(m.children, targetPath)
        if (found) return found
      }
    }
    return null
  }

  const dynamicTitle = findTitle(menuData.value || [], path)
  if (dynamicTitle) {
    return dynamicTitle
  }

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

const navigationSections = computed(() => {
  if (!Array.isArray(menuData.value) || menuData.value.length === 0) {
    return []
  }

  return menuData.value.map((menu) => {
    const children = Array.isArray(menu.children) ? menu.children : []
    const fallbackPath = normalizeManagePath(menu.path || '')
    const sectionMeta = getPageMeta(fallbackPath, menu.title || menu.name)

    if (children.length > 0) {
      return {
        id: menu.id || menu.name || menu.title,
        label: menu.title || menu.name,
        icon: sectionMeta.icon || Operation,
        items: children.map((child) => {
          const childPath = normalizeManagePath(child.path || '')
          const childMeta = getPageMeta(childPath, child.title || child.name)

          return {
            id: child.id || child.name || childPath,
            path: childPath,
            title: child.title || child.name,
            description: childMeta.description,
            icon: childMeta.icon
          }
        })
      }
    }

    return {
      id: menu.id || menu.name || fallbackPath,
      label: '',
      icon: sectionMeta.icon,
      items: [
        {
          id: menu.id || menu.name || fallbackPath,
          path: fallbackPath,
          title: menu.title || menu.name,
          description: sectionMeta.description,
          icon: sectionMeta.icon
        }
      ]
    }
  })
})


const handleSelect = (path) => {
  if (!path || path === route.path) {
    closeMobileMenu()
    return
  }

  router.push(path)
  closeMobileMenu()
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
  const targetPath = fallbackTab?.name || navigationSections.value[0]?.items[0]?.path || '/manage'

  activeTab.value = targetPath
  router.push(targetPath)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768

  if (!isMobile.value) {
    isMobileMenuVisible.value = false
  }
}

const toggleMobileMenu = () => {
  isMobileMenuVisible.value = !isMobileMenuVisible.value
}

const closeMobileMenu = () => {
  isMobileMenuVisible.value = false
}

const isSectionActive = (section) => section.items.some(item => item.path === route.path)

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
    closeMobileMenu()
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
    <ManageHeader />

    <div class="manage-shell" :class="{ 'is-collapsed': isCollapsed }">
      <transition name="manage-fade">
        <button
          v-if="isMobile && isMobileMenuVisible"
          class="manage-drawer-backdrop"
          type="button"
          aria-label="close menu"
          @click="closeMobileMenu"
        />
      </transition>

      <aside class="manage-sidebar" :class="{ 'is-mobile-visible': isMobileMenuVisible, 'is-collapsed': isCollapsed }">
        <div class="manage-sidebar__panel">
          <div class="manage-sidebar__intro" :style="{ justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center', gap: isCollapsed ? '0' : '16px' }">
            <div v-show="!isCollapsed">
              <h2 class="manage-sidebar__title" style="margin-top: 0;">后台管理</h2>
            </div>
            <el-icon 
              class="manage-sidebar__collapse-btn" 
              @click="toggleCollapse"
            >
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
          </div>

          <nav class="manage-sidebar__nav" aria-label="manage navigation">
            <section
              v-for="section in navigationSections"
              :key="section.id"
              class="manage-nav-group"
              :class="{ 'is-active': isSectionActive(section) }"
            >
              <div v-if="section.label" class="manage-nav-group__label" :title="isCollapsed ? section.label : ''">
                <span class="manage-nav-group__label-icon">
                  <el-icon>
                    <component :is="section.icon || Grid" />
                  </el-icon>
                </span>
                <span v-show="!isCollapsed">{{ section.label }}</span>
              </div>

              <div class="manage-nav-group__items">
                <button
                  v-for="item in section.items"
                  :key="item.id"
                  class="manage-nav-item"
                  :class="{ 'is-active': route.path === item.path }"
                  type="button"
                  :title="isCollapsed ? item.title : ''"
                  @click="handleSelect(item.path)"
                >
                  <span class="manage-nav-item__icon">
                    <el-icon>
                      <component :is="item.icon || Grid" />
                    </el-icon>
                  </span>

                  <span class="manage-nav-item__copy" v-show="!isCollapsed">
                    <span class="manage-nav-item__title">{{ item.title }}</span>
                  </span>
                </button>
              </div>
            </section>
          </nav>

        </div>
      </aside>

      <main class="manage-content">
        <button
          class="manage-mobile-toggle"
          type="button"
          @click="toggleMobileMenu"
        >
          <el-icon><Operation /></el-icon>
          <span>菜单</span>
        </button>

        <section class="manage-tabs-card">
          <div class="manage-tabs-shell">
            <el-tabs class="manage-tabs" v-model="activeTab" type="card" closable @tab-remove="handleTabRemove">
              <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
            </el-tabs>

            <div class="manage-view-panel">
              <RouterView />
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
