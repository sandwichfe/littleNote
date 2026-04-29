<script setup>
import './manage-theme.css'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Connection,
  Grid,
  Menu as MenuIcon,
  OfficeBuilding,
  Operation,
  UserFilled
} from '@element-plus/icons-vue'
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

const pageCatalog = [
  {
    path: '/manage/user',
    title: '用户管理',
    eyebrow: 'Accounts',
    description: '集中维护成员账号、所属部门与角色分配，让账号体系清晰可控。',
    icon: UserFilled
  },
  {
    path: '/manage/role',
    title: '角色权限',
    eyebrow: 'Permissions',
    description: '配置角色职责与可访问菜单，建立更清晰的权限边界。',
    icon: Connection
  },
  {
    path: '/manage/menu',
    title: '菜单结构',
    eyebrow: 'Navigation',
    description: '梳理后台菜单层级与入口路径，让系统导航更稳定、更易扩展。',
    icon: MenuIcon
  },
  {
    path: '/manage/dept',
    title: '部门组织',
    eyebrow: 'Organization',
    description: '维护组织架构、负责人和联系方式，支撑更明确的成员归属。',
    icon: OfficeBuilding
  }
]

const pageMetaMap = Object.fromEntries(pageCatalog.map(item => [item.path, item]))

const normalizeManagePath = (path = '') => {
  if (!path) {
    return '/manage'
  }

  if (path.startsWith('/manage')) {
    return path
  }

  return `/manage${path.startsWith('/') ? path : `/${path}`}`
}

const getPageMeta = (path, fallbackTitle = '') => (
  pageMetaMap[path] || {
    title: fallbackTitle || '管理中心',
    eyebrow: 'Workspace',
    description: '统一管理账号、角色、菜单与组织结构，保持后台信息简洁有序。',
    icon: Grid
  }
)

const getTabLabel = (path) => {
  const metaByPath = getPageMeta(path)

  if (metaByPath.title && metaByPath.title !== '管理中心') {
    return metaByPath.title
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

const getDefaultSections = () => [
  {
    id: 'system',
    label: '系统管理',
    icon: Grid,
    items: pageCatalog.map(item => ({
      path: item.path,
      title: item.title,
      description: item.description,
      icon: item.icon
    }))
  }
]

const resolveEntryMeta = (path, title) => getPageMeta(path, title)

const navigationSections = computed(() => {
  if (!Array.isArray(menuData.value) || menuData.value.length === 0) {
    return getDefaultSections()
  }

  return menuData.value.map((menu) => {
    const children = Array.isArray(menu.children) ? menu.children : []
    const fallbackPath = normalizeManagePath(menu.path || '')
    const sectionMeta = resolveEntryMeta(fallbackPath, menu.title)

    if (children.length > 0) {
      return {
        id: menu.id || menu.name || menu.title,
        label: menu.title,
        icon: sectionMeta.icon || Operation,
        items: children.map((child) => {
          const childPath = normalizeManagePath(child.path || '')
          const childMeta = resolveEntryMeta(childPath, child.title)

          return {
            id: child.id || child.name || childPath,
            path: childPath,
            title: child.title,
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
          title: menu.title,
          description: sectionMeta.description,
          icon: sectionMeta.icon
        }
      ]
    }
  })
})

const currentPageMeta = computed(() => getPageMeta(route.path, getTabLabel(route.path)))
const navigationEntryCount = computed(() => (
  navigationSections.value.reduce((total, section) => total + section.items.length, 0)
))

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
  const targetPath = fallbackTab?.name || '/manage/user'

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
    <GlobalHeader />

    <div class="manage-shell">
      <transition name="manage-fade">
        <button
          v-if="isMobile && isMobileMenuVisible"
          class="manage-drawer-backdrop"
          type="button"
          aria-label="close menu"
          @click="closeMobileMenu"
        />
      </transition>

      <aside class="manage-sidebar" :class="{ 'is-mobile-visible': isMobileMenuVisible }">
        <div class="manage-sidebar__panel">
          <div class="manage-sidebar__intro">
            <div class="manage-sidebar__badge">
              <el-icon>
                <component :is="currentPageMeta.icon" />
              </el-icon>
            </div>

            <div>
              <p class="manage-sidebar__eyebrow">Control Center</p>
              <h2 class="manage-sidebar__title">后台管理</h2>
              <p class="manage-sidebar__description">
                统一维护账号、权限、菜单和组织结构，让后台体验更稳定、更清爽。
              </p>
            </div>
          </div>

          <div class="manage-sidebar__section-label">Navigation</div>

          <nav class="manage-sidebar__nav" aria-label="manage navigation">
            <section
              v-for="section in navigationSections"
              :key="section.id"
              class="manage-nav-group"
              :class="{ 'is-active': isSectionActive(section) }"
            >
              <div v-if="section.label" class="manage-nav-group__label">
                <span class="manage-nav-group__label-icon">
                  <el-icon>
                    <component :is="section.icon || Grid" />
                  </el-icon>
                </span>
                <span>{{ section.label }}</span>
              </div>

              <div class="manage-nav-group__items">
                <button
                  v-for="item in section.items"
                  :key="item.id"
                  class="manage-nav-item"
                  :class="{ 'is-active': route.path === item.path }"
                  type="button"
                  @click="handleSelect(item.path)"
                >
                  <span class="manage-nav-item__icon">
                    <el-icon>
                      <component :is="item.icon || Grid" />
                    </el-icon>
                  </span>

                  <span class="manage-nav-item__copy">
                    <span class="manage-nav-item__title">{{ item.title }}</span>
                    <span class="manage-nav-item__description">{{ item.description }}</span>
                  </span>
                </button>
              </div>
            </section>
          </nav>

          <div class="manage-sidebar__footer">
            <div class="manage-sidebar__footer-card">
              <span class="manage-sidebar__footer-label">Open Tabs</span>
              <span class="manage-sidebar__footer-value">{{ tabs.length }}</span>
            </div>

            <div class="manage-sidebar__footer-card">
              <span class="manage-sidebar__footer-label">Nav Entries</span>
              <span class="manage-sidebar__footer-value">{{ navigationEntryCount }}</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="manage-content">
        <section class="manage-content__topbar">
          <button v-if="isMobile" class="manage-mobile-toggle" type="button" @click="toggleMobileMenu">
            <el-icon><Grid /></el-icon>
            <span>{{ isMobileMenuVisible ? '收起菜单' : '展开菜单' }}</span>
          </button>

          <div class="manage-content__heading">
            <p class="manage-content__eyebrow">{{ currentPageMeta.eyebrow }}</p>
            <h1 class="manage-content__title">{{ currentPageMeta.title }}</h1>
            <p class="manage-content__description">{{ currentPageMeta.description }}</p>
          </div>

          <div class="manage-content__meta">
            <div class="manage-meta-card">
              <span class="manage-meta-card__label">Active Tabs</span>
              <span class="manage-meta-card__value">{{ tabs.length }}</span>
              <span class="manage-meta-card__note">保留最近访问页面，切换更顺手。</span>
            </div>

            <div class="manage-meta-card">
              <span class="manage-meta-card__label">Current Module</span>
              <span class="manage-meta-card__value">Manage</span>
              <span class="manage-meta-card__note">围绕系统管理做统一操作与配置。</span>
            </div>
          </div>
        </section>

        <section class="manage-tabs-card">
          <div class="manage-tabs-shell">
            <el-tabs v-model="activeTab" type="card" closable @tab-remove="handleTabRemove">
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
