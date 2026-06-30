<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import Cookies from 'js-cookie'
import { uploadImage } from '@/network/file'
import defaultAvatar from "@/assets/img/default_avatar.jpg";
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword
} from '@/network/manage/user'
import { useMenuStore } from '@/store/menu'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const userInfoContainer = ref(null)
const dropdownWidth = ref('auto')

// 登录状态响应式变量
const loginStatus = ref(Boolean(Cookies.get('loginToken')))

// 计算属性：检查是否已登录
const isLoggedIn = computed(() => {
  return loginStatus.value
})

const ossLoadBaseUrl = import.meta.env.VITE_OSS_LOAD_BASE_URL;

const userForm = ref({
  nickname: '',
  avatar: '',
  gender: '',
  signature: ''
})

const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const cropperDialogVisible = ref(false)
const imageToCrop = ref(null)
const cropperRef = ref(null)

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

// 获取当前用户信息
const fetchUserInfo = async () => {
  // 如果未登录，不获取用户信息
  if (!isLoggedIn.value) {
    return
  }

  try {
    const response = await getCurrentUser()
    const userData = response.data
    userForm.value = {
      nickname: userData.nickname || '默认昵称',
      avatar: userData?.avatarUrl ? `${ossLoadBaseUrl}/${userData.avatarUrl}` : defaultAvatar,
      gender: userData.gender || '',
      signature: userData.signature || ''
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
      avatarUrl: userForm.value.avatar.replace(ossLoadBaseUrl, ''),
      gender: userForm.value.gender,
      signature: userForm.value.signature
    })
    dialogVisible.value = false
    ElMessage.success('保存成功')
    fetchUserInfo()
  } catch (error) {
    console.error('更新用户信息失败:', error)
  }
}

import { logout as authLogout, redirectToLogin } from '@/utils/auth'

// 退出登录 - 仅清除token，停留在当前页面
const logout = () => {
  menuStore.resetMenuState()
  authLogout()
  // 清除用户信息
  userForm.value = {
    nickname: '',
    avatar: '',
    gender: '',
    signature: ''
  }
  // 更新登录状态
  loginStatus.value = false
  ElMessage.success('已退出登录')
}

// 跳转到登录页
const handleLogin = () => {
  redirectToLogin()
}

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
        userForm.value.avatar = `${ossLoadBaseUrl}/${response.data}`
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
  // 更新登录状态
  loginStatus.value = Boolean(Cookies.get('loginToken'))
  // 如果已登录，获取用户信息
  if (loginStatus.value) {
    fetchUserInfo()
  }
})

// 监听路由变化，检测登录状态（用于处理登录回调后的状态更新）
watch(() => route.fullPath, () => {
  const hasToken = Boolean(Cookies.get('loginToken'))
  if (hasToken !== loginStatus.value) {
    loginStatus.value = hasToken
    if (hasToken) {
      // 登录成功，获取用户信息
      fetchUserInfo()
    }
  }
})
</script>

<template>
  <div class="user-avatar-dropdown">
    <!-- 未登录状态：显示登录按钮 -->
    <el-button v-if="!isLoggedIn" type="primary" size="default" @click="handleLogin">
      登录
    </el-button>

    <!-- 已登录状态：显示用户头像下拉菜单 -->
    <el-dropdown v-else trigger="hover" @command="handleCommand" popper-class="user-dropdown">
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

    <!-- 用户信息修改对话框 -->
    <el-dialog v-model="dialogVisible" title="个人资料" width="500px" center append-to-body>
      <el-form :model="userForm" label-width="80px" class="user-info-form">
        <!-- 头像区域 - 居中显示 -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <div class="avatar-upload-container">
                <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar-preview" />
                <el-icon v-else class="avatar-uploader-icon">
                  <Plus />
                </el-icon>
                <div class="avatar-mask">
                  <el-icon class="camera-icon"><Plus /></el-icon>
                  <span class="upload-text">更换头像</span>
                </div>
              </div>
            </el-upload>
          </div>
          <p class="avatar-tip">点击头像可更换，支持 JPG、PNG 格式</p>
        </div>

        <!-- 昵称输入 -->
        <el-form-item label="昵称" class="form-item-custom">
          <el-input
            v-model="userForm.nickname"
            placeholder="请输入昵称"
            maxlength="20"
            show-word-limit
            clearable
          ></el-input>
        </el-form-item>

        <!-- 性别选择 -->
        <el-form-item label="性别" class="form-item-custom">
          <el-radio-group v-model="userForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
            <el-radio label="">保密</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 个性签名 -->
        <el-form-item label="个性签名" class="form-item-custom">
          <el-input
            v-model="userForm.signature"
            type="textarea"
            placeholder="写下你的个性签名..."
            maxlength="100"
            show-word-limit
            :rows="2"
            resize="none"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="updateCurrentUserInfo">保 存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Cropper Dialog -->
    <el-dialog v-model="cropperDialogVisible" title="裁剪头像" width="500px" center append-to-body>
      <div class="cropper-container">
        <Cropper
          ref="cropperRef"
          :src="imageToCrop"
          :stencil-props="{
            aspectRatio: 1/1
          }"
          class="cropper"
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
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="450px" center append-to-body>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="90px" class="password-form">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="updatePassword">确认修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 去除el-dropdown自带的黑框 */
.el-tooltip__trigger:focus-visible {
  outline: unset;
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

/* User Info Form styles */
.user-info-form {
  padding: 0;
}

/* Password Form styles */
.password-form {
  padding: 0;
}

.password-form .el-form-item {
  margin-bottom: 20px;
}

.password-form .el-form-item:last-child {
  margin-bottom: 0;
}

.password-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.password-form :deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

/* Avatar Section - 居中显示 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.avatar-uploader {
  display: block;
}

.avatar-upload-container {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 90px;
  height: 90px;
  line-height: 90px;
  text-align: center;
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: #fff;
  font-size: 12px;
}

.avatar-upload-container:hover .avatar-mask {
  opacity: 1;
}

.avatar-upload-container:hover .avatar-uploader-icon {
  border-color: #409eff;
  color: #409eff;
  background-color: #f0f9ff;
}

.camera-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.upload-text {
  font-size: 11px;
  font-weight: 500;
}

.avatar-tip {
  font-size: 12px;
  color: #909399;
  margin: 0;
  text-align: center;
  line-height: 1.2;
}

/* Form Item Custom */
.form-item-custom {
  margin-bottom: 16px;
}

.form-item-custom:last-of-type {
  margin-bottom: 0;
}

.form-item-custom :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  padding-right: 12px;
}

.form-item-custom :deep(.el-form-item__content) {
  line-height: 40px;
}

.form-item-custom :deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

.form-item-custom :deep(.el-textarea__inner) {
  font-size: 14px;
  padding: 10px 12px;
  line-height: 1.5;
}

.form-item-custom :deep(.el-radio-group) {
  display: flex;
  gap: 24px;
}

.form-item-custom :deep(.el-radio) {
  margin-right: 0;
  height: 40px;
  line-height: 40px;
}

.form-item-custom :deep(.el-radio__label) {
  font-size: 14px;
  color: #606266;
}

.form-item-custom :deep(.el-radio__input) {
  line-height: 1;
}

/* Cropper container */
.cropper-container {
  width: 100%;
  height: 400px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.cropper {
  width: 100%;
  height: 100%;
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

/* Mobile responsive */
@media (max-width: 768px) {
  .nickname {
    display: none;
  }

  .user-info-container {
    padding: 6px;
  }

  .avatar-upload-container,
  .avatar-uploader-icon,
  .avatar-preview {
    width: 80px;
    height: 80px;
    line-height: 80px;
  }

  .camera-icon {
    font-size: 20px;
  }

  .upload-text {
    font-size: 10px;
  }

  .cropper-container {
    height: 300px;
  }
}

/* Small mobile screens */
@media (max-width: 480px) {
  .cropper-container {
    height: 250px;
  }
}
</style>
