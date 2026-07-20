<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules, type UploadRawFile } from 'element-plus'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import Cookies from 'js-cookie'
import { uploadImage } from '@/network/file'
import defaultAvatar from '@/assets/img/default_avatar.jpg'
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword
} from '@/network/manage/user'
import { useMenuStore } from '@/store/menu'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

// 登录状态
const loginStatus = ref(Boolean(Cookies.get('loginToken')))
const isLoggedIn = computed(() => loginStatus.value)

const ossLoadBaseUrl = import.meta.env.VITE_OSS_LOAD_BASE_URL as string

const userForm = ref({
  nickname: '',
  avatar: '',
  gender: '',
  signature: ''
})

const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const cropperDialogVisible = ref(false)
const imageToCrop = ref<string | null>(null)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref<FormInstance>()

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
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

// 拉取当前用户信息
const fetchUserInfo = async () => {
  if (!isLoggedIn.value) return

  try {
    const response = await getCurrentUser() as { data?: Record<string, string> }
    const userData = response?.data || {}
    userForm.value = {
      nickname: userData.nickname || '默认昵称',
      avatar: userData.avatarUrl ? `${ossLoadBaseUrl}/${userData.avatarUrl}` : defaultAvatar,
      gender: userData.gender || '',
      signature: userData.signature || ''
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 保存个人资料
const updateCurrentUserInfo = async () => {
  try {
    const avatarPath = userForm.value.avatar.startsWith(ossLoadBaseUrl)
      ? userForm.value.avatar.replace(ossLoadBaseUrl, '').replace(/^\//, '')
      : userForm.value.avatar

    await updateCurrentUser({
      nickname: userForm.value.nickname,
      avatarUrl: avatarPath,
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

// 退出登录
const logout = () => {
  menuStore.resetMenuState()
  Cookies.remove('loginToken')
  userForm.value = {
    nickname: '',
    avatar: '',
    gender: '',
    signature: ''
  }
  loginStatus.value = false
  ElMessage.success('已退出登录')
  router.push('/login')
}

const handleLogin = () => {
  router.push('/login')
}

const openDialog = () => {
  dialogVisible.value = true
}

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
    await passwordFormRef.value?.validate()
    await changePassword(passwordForm.value)
    passwordDialogVisible.value = false
    ElMessage.success('密码修改成功')
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error: unknown) {
    console.error('修改密码失败:', error)
    const err = error as { response?: { data?: { message?: string } } }
    if (err?.response?.data?.message) {
      ElMessage.error(err.response.data.message)
    } else {
      ElMessage.error('修改密码失败')
    }
  }
}

const handleCommand = (command: string) => {
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

// 选图后进入裁剪
const beforeAvatarUpload = (file: UploadRawFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageToCrop.value = (e.target?.result as string) || null
    cropperDialogVisible.value = true
  }
  reader.readAsDataURL(file)
  return false
}

// 裁剪并上传
const cropAndUpload = () => {
  const result = cropperRef.value?.getResult()
  const canvas = result?.canvas
  if (!canvas) return

  canvas.toBlob(async (blob: Blob | null) => {
    if (!blob) return
    const file = new File([blob], `${Date.now()}.jpg`, { type: 'image/jpeg' })
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

onMounted(() => {
  loginStatus.value = Boolean(Cookies.get('loginToken'))
  if (loginStatus.value) {
    fetchUserInfo()
  }
})

// 路由变化时同步登录态
watch(() => route.fullPath, () => {
  const hasToken = Boolean(Cookies.get('loginToken'))
  if (hasToken !== loginStatus.value) {
    loginStatus.value = hasToken
    if (hasToken) {
      fetchUserInfo()
    }
  }
})
</script>

<template>
  <div class="user-avatar-dropdown">
    <!-- 未登录：登录按钮 -->
    <el-button v-if="!isLoggedIn" type="primary" size="small" class="header-action" @click="handleLogin">
      登录管理
    </el-button>

    <!-- 已登录：头像 + 昵称下拉 -->
    <el-dropdown v-else trigger="hover" @command="handleCommand" popper-class="user-dropdown">
      <div class="user-info-container">
        <el-avatar :size="32" :src="userForm.avatar" class="avatar" />
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
          <el-dropdown-item command="logout" divided>
            <div class="dropdown-item-content">退出登录</div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 个人资料 -->
    <el-dialog v-model="dialogVisible" title="个人资料" width="500px" center append-to-body>
      <el-form :model="userForm" label-width="80px" class="user-info-form">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <div class="avatar-upload-container">
                <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar-preview" alt="" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                <div class="avatar-mask">
                  <el-icon class="camera-icon"><Plus /></el-icon>
                  <span class="upload-text">更换头像</span>
                </div>
              </div>
            </el-upload>
          </div>
        </div>

        <el-form-item label="昵称" class="form-item-custom">
          <el-input
            v-model="userForm.nickname"
            placeholder="请输入昵称"
            maxlength="20"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="性别" class="form-item-custom">
          <el-radio-group v-model="userForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
            <el-radio label="">保密</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="个性签名" class="form-item-custom">
          <el-input
            v-model="userForm.signature"
            type="textarea"
            placeholder="个性签名"
            maxlength="100"
            show-word-limit
            :rows="2"
            resize="none"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="updateCurrentUserInfo">保 存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 裁剪头像 -->
    <el-dialog v-model="cropperDialogVisible" title="裁剪头像" width="500px" center append-to-body>
      <div class="cropper-container">
        <Cropper
          ref="cropperRef"
          :src="imageToCrop || undefined"
          :stencil-props="{ aspectRatio: 1 }"
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

    <!-- 修改密码 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px" center append-to-body>
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="80px"
        class="password-form"
      >
        <el-form-item label="原密码" prop="oldPassword" class="form-item-custom">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword" class="form-item-custom">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" class="form-item-custom">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
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
/* 去掉 dropdown 聚焦描边 */
.el-tooltip__trigger:focus-visible {
  outline: unset;
}

.user-info-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.user-info-container:hover {
  background: #f3f4f6;
}

.avatar {
  flex-shrink: 0;
}

.nickname {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  max-width: 96px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.dropdown-item-content {
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info-form,
.password-form {
  padding: 0;
}

/* 头像上传区 */
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
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #9ca3af;
  width: 90px;
  height: 90px;
  line-height: 90px;
  text-align: center;
  border: 1px dashed #d1d5db;
  border-radius: 50%;
  background-color: #f9fafb;
}

.avatar-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
  color: #fff;
  font-size: 12px;
}

.avatar-upload-container:hover .avatar-mask {
  opacity: 1;
}

.camera-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.upload-text {
  font-size: 11px;
  font-weight: 500;
}

.form-item-custom {
  margin-bottom: 16px;
}

.form-item-custom:last-of-type {
  margin-bottom: 0;
}

.form-item-custom :deep(.el-form-item__label) {
  font-weight: 500;
  color: #111827;
  font-size: 14px;
}

.form-item-custom :deep(.el-radio-group) {
  display: flex;
  gap: 24px;
}

.form-item-custom :deep(.el-radio) {
  margin-right: 0;
}

/* 裁剪区 */
.cropper-container {
  width: 100%;
  height: 400px;
  background-color: #f5f5f7;
  border-radius: 6px;
  overflow: hidden;
}

.cropper {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .nickname {
    display: none;
  }

  .user-info-container {
    padding: 4px;
  }

  .cropper-container {
    height: 300px;
  }
}
</style>
