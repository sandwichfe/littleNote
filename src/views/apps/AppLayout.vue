<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import Cookies from 'js-cookie'
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword
} from '@/network/user'
import { uploadImage } from '@/network/base'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userInfoContainer = ref(null)
const dropdownWidth = ref('auto')

// 获取当前用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getCurrentUser()
    const userData = response.data
    userForm.value = {
      nickname: userData.nickname || '默认昵称',
      avatar: userData.avatarUrl || 'http://49.235.149.110/favicon.ico'
    }
    await nextTick()
    if (userInfoContainer.value) {
      dropdownWidth.value = `${userInfoContainer.value.offsetWidth}px`
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 更新当前用户信息
const updateCurrentUserInfo = async () => {
  try {
    await updateCurrentUser({
      nickname: userForm.value.nickname,
      avatarUrl: userForm.value.avatar,
    })
    dialogVisible.value = false
    ElMessage.success('保存成功')
    fetchUserInfo()
  } catch (error) {
    console.error('更新用户信息失败:', error)
  }
}

const logout = () => {
  Cookies.remove('loginToken')
  router.push('/login')
}

const dialogVisible = ref(false)
const userForm = ref({
  nickname: '',
  avatar: ''
})

const passwordDialogVisible = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref(null)

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const cropperDialogVisible = ref(false)
const imageToCrop = ref(null)
const cropperRef = ref(null)

const openDialog = () => {
  dialogVisible.value = true
}

// 打开修改密码对话框
const openPasswordDialog = () => {
  passwordDialogVisible.value = true
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

// 修改密码
const updatePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    await changePassword(passwordForm.value)
    passwordDialogVisible.value = false
    ElMessage.success('密码修改成功')
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('修改密码失败')
    }
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'openDialog':
      openDialog()
      break
    case 'changePassword':
      openPasswordDialog()
      break
    case 'logout':
      logout()
      break
  }
}

const beforeAvatarUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageToCrop.value = e.target.result
    cropperDialogVisible.value = true
  }
  reader.readAsDataURL(file)
  return false
}

const cropAndUpload = () => {
  const { canvas } = cropperRef.value.getResult()
  if (canvas) {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" })
      try {
        const response = await uploadImage(file)
        userForm.value.avatar = `${import.meta.env.VITE_OSS_LOAD_BASE_URL}/${response.data}`
        ElMessage.success('上传成功')
        cropperDialogVisible.value = false
      } catch (error) {
        console.error('上传头像失败:', error)
        ElMessage.error('上传头像失败')
      }
    }, 'image/jpeg')
  }
}

onMounted(() => {
  fetchUserInfo()
})


</script>

<template>
  <div class="app-layout">
    <!-- 顶部 Header -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo" @click="router.push('/note')">
          <span class="logo-text">LittleNote</span>
        </div>
      </div>

      <div class="header-right">
        <!-- 用户信息 -->
        <el-dropdown trigger="hover" @command="handleCommand" >
          <div class="user-info-container" ref="userInfoContainer">
            <el-avatar :size="36" :src="userForm.avatar" class="avatar"></el-avatar>
            <span class="nickname" :title="userForm.nickname">{{ userForm.nickname }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu style="width: 150px;">
              <el-dropdown-item command="openDialog">
                <div class="dropdown-item-content">修改资料</div>
              </el-dropdown-item>
              <el-dropdown-item command="changePassword">
                <div class="dropdown-item-content">修改密码</div>
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <div class="dropdown-item-content">退出登录</div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="app-content">
      <RouterView />
    </main>

    <!-- 用户信息修改对话框 -->
    <el-dialog v-model="dialogVisible" title="修改用户信息" width="30%">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="头像">
          <el-upload class="avatar-uploader" :show-file-list="false" :before-upload="beforeAvatarUpload">
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
    <el-dialog v-model="cropperDialogVisible" title="裁剪头像" width="650px" center>
      <div style="height: 450px;">
        <Cropper
          ref="cropperRef"
          :src="imageToCrop"
          :stencil-props="{
            aspectRatio: 1/1
          }"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cropperDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="cropAndUpload">确 认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="30%">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updatePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 去除el-dropdown自带的黑框 */
.el-tooltip__trigger:focus-visible {
  outline: unset;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f2f5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  color: #82e7eb82;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown{
  border: none;
  outline: none;
}

.user-info-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.avatar {
  transition: transform 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-info-container:hover .avatar {
  transform: scale(1.1);
}

.nickname {
  font-weight: 500;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item-content {
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-content {
  flex: 1;
  overflow: auto;
  background-color: #f0f2f5;
}

/* Avatar uploader styles */
.avatar-uploader {
  display: inline-block;
}

.avatar-uploader .avatar {
  width: 120px;
  height: 120px;
  display: block;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-uploader .avatar:hover {
  opacity: 0.8;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-uploader-icon:hover {
  border-color: #409eff;
  color: #409eff;
}

/* Dropdown styling - 移除默认的 outline 和 border */
:deep(.el-dropdown) {
  outline: none !important;
}

:deep(.el-dropdown:focus) {
  outline: none !important;
}

:deep(.el-dropdown:focus-visible) {
  outline: none !important;
}

/* Dialog styling */
:deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: #606266;
}

:deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .app-header {
    padding: 0 15px;
    height: 56px;
  }

  .logo-text {
    font-size: 20px;
  }

  .nickname {
    display: none;
  }

  .user-info-container {
    padding: 6px;
  }

  :deep(.el-dialog) {
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



