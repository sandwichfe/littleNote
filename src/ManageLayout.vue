<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Setting, Plus } from '@element-plus/icons-vue';
import Cookies from 'js-cookie';
import {
  getCurrentUser,
  updateCurrentUser
} from '@/network/user'
import { getCurrentUserMenus } from '@/network/menu'
import { generateRoutes } from '@/router'

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.path)
const tabs = ref([
])
const menuData = ref([])


// 获取菜单数据
const fetchMenuData = async () => {
  try {
    const response = await getCurrentUserMenus()
    if (response.code === 200) {
      menuData.value = response.data
      // 生成动态路由
      const routes = generateRoutes(response.data)
      // 添加动态路由到根路由的 children 中
      routes.forEach(route => {
        if (!router.hasRoute(route.name)) {
          router.addRoute('/', route) // 注意这里改为添加到根路由
        }
      })
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error)
  }
}

const handleSelect = (index) => {
  router.push(index)
  // 如果是移动端，点击后关闭菜单
  if (isMobile.value) {
    isMobileMenuVisible.value = false
  }
}

// 初始化时确保当前路径在 tabs 中
onMounted(() => {

  // 菜单信息
  fetchMenuData()

  if (route.path !== '/' && !tabs.value.some(tab => tab.name === route.path)) {
    tabs.value.push({ name: route.path, label: route.path.slice(1) })
  }

  // 页面加载时获取用户信息
  fetchUserInfo() 

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


const logout = () => {
  Cookies.remove("loginToken");
  router.push('/login');
}

const isFloatingMenuVisible = ref(false)

const toggleFloatingMenu = () => {
  // console.log('toggleFloatingMenu')
  // console.log('begin', isFloatingMenuVisible.value)
  isFloatingMenuVisible.value = !isFloatingMenuVisible.value
  // console.log('end', isFloatingMenuVisible.value)
}
const showFloatingMenu = () => {
  // console.log('showFloatingMenu')
  isFloatingMenuVisible.value = true
}

const hideFloatingMenu = () => {
  // 避免鼠标移出菜单时，菜单被隐藏
  setTimeout(() => {
    if (!document.querySelector('.floating-menu:hover')) {
      isFloatingMenuVisible.value = false;
    }
  }, 200);
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
  userForm.value.avatar = 'http://49.235.149.110/favicon.ico';
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式!')
  }
  return isJPG
}

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

// 初始化时检测
onMounted(() => {
  checkMobile()
  console.log('isMobile', isMobile.value)
  window.addEventListener('resize', checkMobile)
})





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
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        @select="handleSelect"
      >
        <!-- 使用递归组件方式渲染菜单 -->
        <template v-for="menu in menuData" :key="menu.id">
          <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path || menu.name">
            <template #title>{{ menu.title }}</template>
            <template v-for="subMenu in menu.children" :key="subMenu.id">
              <el-menu-item :index="subMenu.path">{{ subMenu.title }}</el-menu-item>
            </template>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">{{ menu.title }}</el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- 右侧区域 -->
    <div class="right-content" style="width: 100%;" @click="isMobileMenuVisible = false">
      <!--用户信息  -->
      <header class="header">
        <div class="user-info-container" @click="toggleFloatingMenu" @mouseenter="!isMobile && showFloatingMenu()"
          @mouseleave="!isMobile && hideFloatingMenu()">
          <el-avatar :size="40" :src="userForm.avatar" class="avatar"></el-avatar>
          <span class="nickname">{{ userForm.nickname }}</span>
          <el-icon :size="25" color="#9fc4f0">
            <Setting />
          </el-icon>

          <div class="floating-menu" v-show="isFloatingMenuVisible" @mouseenter="!isMobile && showFloatingMenu()"
            @mouseleave="!isMobile && hideFloatingMenu()">
            <div class="menu-item" @click="openDialog">修改资料</div>
            <div class="menu-item" @click="logout">退出登录</div>
          </div>

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

    <!-- 用户信息修改对话框 -->
    <el-dialog v-model="dialogVisible" title="修改用户信息" width="30%">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="头像">
          <el-upload class="avatar-uploader" :action="'/upload/avatar'" :show-file-list="false"
            :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
            <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon>
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
.menu {
  width: 200px;
  background-color: #f5f5f5;
  transition: transform 0.3s ease;
}

.manage-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.content {
  flex: 1;
  padding: 20px;
  overflow: auto;
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

.user-info-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.floating-menu {
  display: block;
  position: absolute;
  top: 40px;
  right: 95px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 10px;
  width: 120px;
  z-index: 1000;
}

.floating-menu .menu-item {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.floating-menu .menu-item:hover {
  background-color: #f5f5f5;
}

.floating-menu .menu-item.active {
  background-color: #e6f7ff;
}

/* // 在原有样式基础上新增媒体查询 */
@media (max-width: 768px) {

  * {
    /* 禁用移动端点击效果 */
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    outline: none;
  }

  .hamburger {
    /* 保持原有样式 */
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 1px 0 4px rgba(0, 0, 0, 0.05);
    border-radius: 0 4px 4px 0;
    left: 0;
    padding: 10px;
    transition: all 0.3s ease;
    /* 新增图标样式 */
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
  }

  .hamburger svg {
    transition: transform 0.3s ease;
    transform: rotate(0deg);
  }

  .hamburger svg.arrow-open {
    transform: rotate(-180deg);
  }

  /* 菜单展开时隐藏背景 */
  .menu.mobile-menu-visible+.hamburger {
    background: transparent;
    box-shadow: none;
  }

  .menu {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    transform: translateX(-100%);
  }

  .menu.mobile-menu-visible {
    transform: translateX(0);
  }

  .el-tabs__item {
    padding: 0 8px !important;
    font-size: 12px;
  }

  /* 弹窗适配 */
  .el-dialog {
    width: 90% !important;
  }

  .manage-layout {
    position: relative;
    overflow-x: hidden;
  }

  .header {
    padding: 10px 5%;
    justify-content: flex-end;
    width: 100%;
    display: flex;
  }

  .content {
    padding: 10px;

    .el-tabs__item {
      padding: 0 10px;
      font-size: 12px;
    }
  }

  .user-info-container {
    display: flex;
    justify-content: flex-end;
    width: auto;
    gap: 8px;
    position: static !important;
    padding-right: 15px;
    -webkit-tap-highlight-color: transparent;
  }

  .floating-menu {
    top: 45px;
    right: 5%;
    width: 120px;
    z-index: 2000;
    /* 添加触摸优化 */
    touch-action: manipulation;
  }

  /* 弹窗优化 */
  .el-dialog {
    width: 95% !important;
    max-width: 100vw;
    margin: 2vh auto !important;

    .el-form-item {
      flex-direction: column;
      margin-bottom: 15px;

      :deep(.el-form-item__label) {
        width: 100% !important;
        text-align: left;
        margin-bottom: 8px;
      }

      .el-input {
        width: 100% !important;
      }
    }

    .el-dialog__footer {
      padding: 10px 15px;

      .el-button {
        width: 100%;
        margin: 5px 0;
      }
    }
  }

  /* 头像上传区域适配 */
  .avatar-uploader {
    .el-upload {
      width: 80px !important;
      height: 80px !important;
    }
  }


}
</style>