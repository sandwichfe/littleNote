<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import UserAvatarDropdown from '@/components/UserAvatarDropdown.vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.path)
const tabs = ref([])
const menuStore = useMenuStore()
const menuData = menuStore.menuData

const handleSelect = (index) => {
  router.push(index)
  // 如果是移动端，点击后关闭菜单
  if (isMobile.value) {
    isMobileMenuVisible.value = false
  }
}

// 初始化时确保当前路径在 tabs 中
onMounted(() => {
  if (route.path !== '/' && !tabs.value.some(tab => tab.name === route.path)) {
    tabs.value.push({ name: route.path, label: route.path.slice(1) })
  }
  
  checkMobile()
  console.log('isMobile', isMobile.value)
  window.addEventListener('resize', checkMobile)
})

// 关闭单个 Tab
const handleTabRemove = (tabName) => {
  const index = tabs.value.findIndex(tab => tab.name === tabName)
  if (index !== -1) {
    tabs.value.splice(index, 1)
    if (activeTab.value === tabName) {
      activeTab.value = tabs.value[0].name
      router.push(tabs.value[0].name)
    }
  }
}

watch(() => route.path, (newPath) => {
  if (newPath !== '/login') {
    activeTab.value = newPath
    if (!tabs.value.some(tab => tab.name === newPath)) {
      tabs.value.push({ name: newPath, label: newPath.slice(1) })
    }
  }
})

watch(activeTab, (newTab) => {
  if (newTab !== route.path) {
    router.push(newTab)
  }
})

const isMobileMenuVisible = ref(false)
const isMobile = ref(false)

// 检测移动端状态
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 切换移动端菜单
const toggleMobileMenu = () => {
  isMobileMenuVisible.value = !isMobileMenuVisible.value
}
</script>

<template>
  <div class="manage-layout">

    <!-- 汉堡菜单按钮 -->
    <div v-if="isMobile" class="hamburger" @click="toggleMobileMenu">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </div>


    <!-- 左侧菜单 -->
    <div class="menu" :class="{ 'mobile-menu-visible': isMobileMenuVisible }">
      <el-menu :default-active="route.path" class="el-menu-vertical" @select="handleSelect">
        <!-- 使用递归组件方式渲染菜单 -->
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
    </div>

    <!-- 右侧区域 -->
    <div class="right-content" style="width: 100%;" @click="isMobileMenuVisible = false">
   
      <header class="header">

           <!--用户信息  -->
        <div>
          <UserAvatarDropdown />
        </div>

      </header>

      <!-- 内容区域 -->
      <div class="content" style="width: 100%;">
        <el-tabs v-model="activeTab" type="card" closable @tab-remove="handleTabRemove">
          <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
            <RouterView />
          </el-tab-pane>
        </el-tabs>
      </div>

    </div>
    
  </div>
</template>


<style scoped>
.header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
}

.manage-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f2f5; /* Softer background for the entire layout */
}

.menu {
  width: 220px; /* Slightly wider menu */
  background-color: #ffffff; /* White background for menu */
  transition: transform 0.3s ease, width 0.3s ease; /* Added width transition */
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05); /* Subtle shadow for menu */
  border-right: 1px solid #e8e8e8; /* Light border */
}

.el-menu-vertical {
  border-right: none; /* Remove default border as we added one to .menu */
}

.el-menu-item,
.el-sub-menu__title {
  transition: background-color 0.3s ease, color 0.3s ease; /* Smooth hover effect */
  border-radius: 4px; /* Rounded corners for menu items */
  margin: 4px 8px; /* Add some margin around items */
}

.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #e6f7ff; /* Light blue hover background */
  color: #1890ff; /* Ant Design blue for hover text */
}

.el-menu-item.is-active {
  background-color: #1890ff; /* Ant Design blue for active item */
  color: #fff;
}

.el-menu-item.is-active:hover {
  background-color: #096dd9; /* Darker blue on hover for active item */
}

.right-content {
  flex: 1; /* Ensure it takes remaining space */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent content overflow issues */
}

.content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #ffffff; /* Softer, more modern background */
  transition: background-color 0.3s ease;
}

.el-tabs--card > .el-tabs__header {
  border-bottom: 1px solid #dcdfe6; /* Lighter border */
  margin-bottom: 0;
  background-color: #ffffff; /* Light background for tab header area */
  border-radius: 6px 6px 0 0; /* Rounded corners for the header */
  padding: 5px 5px 0 5px; /* Add some padding to header */
}

.el-tabs--card > .el-tabs__header .el-tabs__nav {
  border: none;
  border-radius: 0;
}

.el-tabs--card > .el-tabs__header .el-tabs__item {
  border: 1px solid transparent; /* Make border transparent initially */
  border-bottom: none;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  margin-right: 5px; /* Space between tabs */
  background-color: transparent; /* Transparent background for inactive tabs */
  color: #606266; /* Default text color */
  border-radius: 4px 4px 0 0;
  padding: 0 20px; /* More padding for a modern look */
  height: 40px; /* Consistent height */
  line-height: 40px;
  font-weight: 500;
}

.el-tabs--card > .el-tabs__header .el-tabs__item:hover {
  color: #409eff;
  background-color: #e9eef3; /* Subtle hover background */
}

.el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
  background-color: #ffffff; /* White background for active tab */
  color: #409eff; /* Element Plus primary color */
  border-color: #dcdfe6 #dcdfe6 #ffffff; /* Border to blend with content */
  border-bottom: 1px solid #ffffff; /* Cover the header bottom border */
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05); /* Subtle shadow for active tab */
  transform: translateY(-1px); /* Slight lift effect */
}

.el-tabs__content {
  padding: 20px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-top: none;
  border-radius: 0 0 6px 6px; /* Rounded corners for content */
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); /* More pronounced shadow */
  min-height: calc(100vh - 160px); /* Ensure content area fills space, adjust as needed */
}

/* Hamburger menu for mobile */
.hamburger {
  position: fixed; /* Keep it fixed for mobile */
  top: 15px;
  left: 15px;
  z-index: 1001; /* Above menu */
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
    top: 0;
    height: 100vh;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    width: 250px; /* Ensure it's wide enough on mobile */
  }

  .menu.mobile-menu-visible {
    transform: translateX(0);
  }

  .right-content {
    width: 100%;
    transition: margin-left 0.3s ease; /* Smooth transition when menu opens/closes */
  }

  .header {
    padding: 0 15px;
    height: 56px;
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
}
</style>
