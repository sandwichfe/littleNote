<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { Setting } from '@element-plus/icons-vue';

const route = useRoute()
const router = useRouter()
const store = useStore()
const activeTab = ref(route.path)
const tabs = ref([
  { name: '/', label: '首页' },
])

// 初始化时确保当前路径在 tabs 中
onMounted(() => {
  if (route.path !== '/' && !tabs.value.some(tab => tab.name === route.path)) {
    tabs.value.push({ name: route.path, label: route.path.slice(1) })
  }
})

const contextMenuPosition = ref({ x: 0, y: 0 })

// 显示右键菜单
const showContextMenu = (event) => {
  event.preventDefault()
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
}

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
</script>

<template>
  <div class="manage-layout">
    <div class="menu">
      <el-menu :default-active="activeTab" @select="(path) => $router.push(path)">
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/note">笔记</el-menu-item>
        <el-sub-menu index="system">
          <template #title>系统管理</template>
          <el-menu-item index="/user">用户管理</el-menu-item>
          <el-menu-item index="/role">角色管理</el-menu-item>
          <el-menu-item index="/menu">菜单管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/qrcode">二维码</el-menu-item>
      </el-menu>
    </div>
    <div class="content" style="width: 100%;">
      <header class="header">
        <div class="user-info">
          <!-- <div>yiru</div> -->
          <el-avatar :size="40" src="http://49.235.149.110/favicon.ico"></el-avatar>
          <span class="nickname">{{ "一如" }}</span>
          <el-icon :size="25" color="#9fc4f0">
            <Setting />
          </el-icon>
        </div>
      </header>
      <el-tabs
        v-model="activeTab"
        type="card"
        closable
        @tab-remove="handleTabRemove"
        @contextmenu.prevent="showContextMenu"
      >
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <RouterView />
        </el-tab-pane>
      </el-tabs>
    </div>

  </div>
</template>

<style scoped>
.manage-layout {
  display: flex;
  height: 100vh;
}

.menu {
  width: 200px;
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 20px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px; /* 添加间距 */
}

.user-info .nickname {
  margin-left: 5px;
  font-size: 16px;
  margin-right: 10px;
  color: #00bcd4;
}
</style>