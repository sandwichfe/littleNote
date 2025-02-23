<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.path)
const tabs = ref([
  { name: '/', label: '首页' },
])

watch(() => route.path, (newPath) => {
  activeTab.value = newPath
  if (!tabs.value.some(tab => tab.name === newPath)) {
    tabs.value.push({ name: newPath, label: newPath.slice(1) })
  }
})

watch(activeTab, (newTab) => {
  if (newTab !== route.path) {
    router.push(newTab)
  }
})

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
</script>

<template>
  <div class="app-container">
    <div class="menu">
      <el-menu :default-active="activeTab" @select="(path) => $router.push(path)">
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/note">笔记</el-menu-item>
        <el-sub-menu index="system">
          <template #title>系统管理</template>
          <el-menu-item index="/user">用户管理</el-menu-item>
          <el-menu-item index="/role">角色管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/qrcode">二维码</el-menu-item>
      </el-menu>
    </div>
    <div class="content">
      <el-tabs v-model="activeTab" type="card" closable @tab-remove="handleTabRemove">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <RouterView />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style>
.app-container {
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

* {
  margin: 0;
  padding: 0;
}

#app {
  margin-left: auto;
  width: 100%;
  height: 100%;
}

/*清除点击时的高亮颜色*/
a,
input,
button,
div {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

/*清除ios下的默认圆角*/
input,
button {
  -webkit-appearance: none;
  border-radius: 0;
}

body {
  -webkit-text-size-adjust: 100%;/*禁止文字缩放*/
}

body * {
  font-family: helvetica; /*默认字体设置*/
}
</style>