<script setup>
import { ref,onMounted,watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { Setting, Plus } from '@element-plus/icons-vue';
import { 
  getCurrentUser,
  updateCurrentUser
} from '@/network/user'


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

  fetchUserInfo() // 页面加载时获取用户信息

})


// 获取当前用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getCurrentUser() // 调用 /sys/user/current 接口
    const userData = response.data
    userForm.value = {
      nickname: userData.nickname || '默认昵称',
      avatar: userData.avatarUrl || 'http://49.235.149.110/favicon.ico'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 更新当前用户信息
const updateCurrentUserInfo = async () => {
  try {
    const response = await updateCurrentUser(userForm.value) 
    dialogVisible.value = false
    ElMessage.success('保存成功')
    fetchUserInfo();

  } catch (error) {
    console.error('更新用户信息失败:', error)
  }
}




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

const dialogVisible = ref(false)
const userForm = ref({
  nickname: '',
  avatar: ''
})

const openDialog = () => {
  dialogVisible.value = true
}

const handleAvatarSuccess = (response) => {
  // userForm.value.avatar = response.url // 假设返回的图片 URL 在 response.url 中
  userForm.value.avatar ='http://49.235.149.110/favicon.ico';
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式!')
  }
  return isJPG
}
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
        <div class="user-info" @click="openDialog">
          <el-avatar :size="40" :src="userForm.avatar"></el-avatar>
          <span class="nickname">{{ userForm.nickname }}</span>
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

    <!-- 用户信息修改对话框 -->
    <el-dialog v-model="dialogVisible" title="修改用户信息" width="30%">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :action="'/upload/avatar'" 
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateCurrentUserInfo">保存</el-button>
      </template>
    </el-dialog>
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

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  display: block;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
}
</style>