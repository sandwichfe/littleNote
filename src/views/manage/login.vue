<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Cookies from 'js-cookie';
import Vcode from 'vue3-puzzle-vcode';
import { userLogin } from '@/network/base';
import { useMenuStore } from '@/store/menu';
import { closeLoading, openLoading } from "@/utils/loadingUtil";
import { User, Lock } from '@element-plus/icons-vue';

onMounted(() => {
  // 访问管理登录页面 清除token
  Cookies.remove("loginToken");
});

const router = useRouter();
const menuStore = useMenuStore();

const loginForm = ref({
  username: '',
  password: '',
});

const isShowVcode = ref(false);

const handleLogin = async () => {
  if (loginForm.value.username === "" || loginForm.value.password === "") {
    ElMessage.error("用户名或密码不能为空");
    return;
  }
  // 弹出滑块验证
  isShowVcode.value = true;
};

const onSuccess = async () => {
  isShowVcode.value = false;
  openLoading('正在登录管理系统...');
  
  try {
    const res = await userLogin(loginForm.value.username, loginForm.value.password);
    if (res && res.code === 200) {
      Cookies.set("loginToken", res.data, { expires: 7 });
      
      // 获取菜单和路由
      const { success, message } = await menuStore.fetchAndSetMenus();
      if (success) {
        ElMessage.success("登录成功");
        router.push('/manage');
      } else {
        ElMessage.error(message || '管理菜单加载失败');
        Cookies.remove("loginToken");
      }
    } else {
      ElMessage.error(res?.msg || '登录失败');
      Cookies.remove("loginToken");
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.msg || error?.message || '登录请求失败';
    ElMessage.error(errorMessage);
  } finally {
    closeLoading();
  }
};

const onVcodeClose = () => {
  isShowVcode.value = false;
};

const onVcodeFail = () => {
  ElMessage.error("验证失败，请重试");
};
</script>

<template>
  <div class="manage-login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-area">
          <div class="logo-box">LN</div>
          <h1>LittleNote</h1>
        </div>
        <p class="subtitle">管理系统中心</p>
      </div>

      <el-form :model="loginForm" class="login-form" @keyup.enter="handleLogin">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="管理员账号"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="管理员密码"
            :prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="submit-btn"
          size="large"
          @click="handleLogin"
        >
          登录系统
        </el-button>
      </el-form>

    </div>

    <Vcode
      :show="isShowVcode"
      @success="onSuccess"
      @close="onVcodeClose"
      @fail="onVcodeFail"
      :canvas-width="310"
      :canvas-height="160"
    />
  </div>
</template>

<style scoped>
.manage-login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.1), transparent 40%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.1), transparent 40%),
    #f8fafc;
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-box {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #0da49a 0%, #0f766e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: bold;
  font-size: 18px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  padding: 4px 12px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #0da49a inset !important;
}

.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: #0da49a;
  border: none;
  font-weight: 600;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: #0f766e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 164, 154, 0.2);
}

.login-footer {
  text-align: center;
}

.back-link {
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: #0da49a;
}
</style>
