<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import Cookies from 'js-cookie';
import {
  getCurrentUser,
  updateCurrentUser
} from '@/network/user'
import { uploadImage } from '@/network/base'
import { useMenuStore } from '@/store/menu'
import { ElMessage } from 'element-plus';

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.path)
const tabs = ref([
])
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
    const response = await updateCurrentUser({
      nickname: userForm.value.nickname,
      avatarUrl: userForm.value.avatar,
    })
    dialogVisible.value = false
    ElMessage.success('保存成功')
    fetchUserInfo();
  } catch (error) {
    console.error('更新用户信息失败:', error)
  }
}


const logout = () => {
  menuStore.resetMenuState()
  Cookies.remove('loginToken')
  router.push('/login');
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

const cropperDialogVisible = ref(false)
const imageToCrop = ref(null)
const cropperRef = ref(null)

const openDialog = () => {
  dialogVisible.value = true
}



const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式!');
    return false;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    imageToCrop.value = reader.result;
    cropperDialogVisible.value = true;
  };

  return false; // Prevent el-upload from uploading automatically
};

const cropAndUpload = () => {
  const { canvas } = cropperRef.value.getResult();
  if (canvas) {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      try {
        const response = await uploadImage(file);
        userForm.value.avatar = `${import.meta.env.VITE_UPLOAD_BASE_URL}/${response.data}`;
        ElMessage.success('上传成功');
        cropperDialogVisible.value = false;
      } catch (error) {
        console.error('上传头像失败:', error);
        ElMessage.error('上传头像失败');
      }
    }, 'image/jpeg');
  }
};

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
      <el-menu :default-active="route.path" class="el-menu-vertical" @select="handleSelect">
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
   
      <header class="header">

           <!--用户信息  -->
        <div>
          <el-dropdown trigger="hover" @command="handleCommand">
            <div class="user-info-container">
              <el-avatar :size="40" :src="userForm.avatar" class="avatar"></el-avatar>
              <span class="nickname">{{ userForm.nickname }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="openDialog" @click="openDialog">修改资料</el-dropdown-item>
                <el-dropdown-item command="logout" @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
                              <el-upload class="avatar-uploader" :show-file-list="false"
            :before-upload="beforeAvatarUpload">
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

    <!-- Cropper Dialog -->
    <el-dialog v-model="cropperDialogVisible" title="裁剪头像" width="50%">
      <div style="height: 400px;">
        <Cropper
          ref="cropperRef"
          :src="imageToCrop"
          :stencil-props="{
            aspectRatio: 1/1
          }"
        />
      </div>
      <template #footer>
        <el-button @click="cropperDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="cropAndUpload">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
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

.header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 24px; /* Adjusted padding */
  height: 64px; /* Standard header height */
  border-bottom: 1px solid #e8e8e8;
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.user-info-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px; /* Increased gap */
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  outline: none;
}

.user-info-container:hover {
  background-color: #f0f2f5; /* Light hover effect */
}

.avatar {
  transition: transform 0.3s ease;
}

.user-info-container:hover .avatar {
  transform: scale(1.1); /* Slight zoom on avatar hover */
}

.nickname {
  font-weight: 500;
  color: #333;
}

.content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #ffffff; /* Softer, more modern background */
  transition: background-color 0.3s ease;
}

/* Tabs styling */
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

/* Dialog styling */
.el-dialog {
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #303133;
  border-radius: 8px 8px 0 0;
}

.el-dialog__body {
  padding: 24px;
  color: #606266;
}

.el-dialog__footer {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  border-radius: 0 0 8px 8px;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
}
.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px; /* Adjusted size */
  height: 120px;
  line-height: 120px;
  text-align: center;
}
.avatar-uploader .avatar {
  width: 120px;
  height: 120px;
  display: block;
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

  /* Removed margin-left push when menu is visible to allow full screen content with overlay menu */
  /* .menu.mobile-menu-visible + .right-content {
    margin-left: 250px; 
  } */

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

  .el-dialog {
    width: 90% !important;
    margin: 5vh auto !important;
  }



  .avatar-uploader-icon,
  .avatar-uploader .avatar {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }
}

</style>