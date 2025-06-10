<script setup lang="ts">
import { ref,onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Cookies from 'js-cookie';
import Vcode from 'vue3-puzzle-vcode';
import Img01 from "@/assets/img/yysls_1.jpg";
import Img02 from "@/assets/img/yysls_2.jpg";
import Img03 from "@/assets/img/yysls_3.jpg";
import Img04 from "@/assets/img/yysls_4.jpg";
import Img05 from "@/assets/img/wwnn_1.jpg";
import Img06 from "@/assets/img/wwnn_2.jpg";
// 使用 import 语法引入图片路径
import verityImgPath from '@/assets/img/yysls_4.jpg';

import QRCode from '@/components/QRCode.vue';
import { userLogin, generateQrCode, qrCoderStatus, userRegister } from '@/network/base';


onMounted(() => {
  // 访问登录页面  清除token
  Cookies.remove("loginToken");
});

const requestIp = ref(import.meta.env.VITE_API_URL);
const router = useRouter();

const loginForm = ref({
  username: '',
  password: ''
});

const isShow = ref(false);

const loginToken = ref("");

const verityImg = ref(verityImgPath);

const login = async () => {
  if (loginForm.value.username === "" || loginForm.value.password === "") {
    ElMessage.error("用户名或密码不能为空");
    return;
  } else {
    // 弹出滑块形码
    isShow.value = true;
  }
};

/**
 * 滑块验证码成功回调  做登录相关操作
 * @param {Object} msg
 */
const success = (msg) => {
  isShow.value = false;
  // 登录请求
  userLogin(loginForm.value.username, loginForm.value.password).then((res) => {
    if (res) {
      if (res.code == 200) {
        loginToken.value = res.data;
        Cookies.remove("loginToken");
        Cookies.set("loginToken", loginToken.value, { expires: 7 });
        router.push('/');
        ElMessage.success("登录成功");
      } else {
        ElMessage.error(res.msg || "登录失败，请检查用户名或密码");
      }
    }
  });

};

const close = () => {
  isShow.value = false;
};

const fail = () => {
  ElMessage.error("验证失败");
};

// 在script部分新增
const showQrcode = ref(false)
const qrcodeUrl = ref('')
const qrcodeId = ref('')


// 在script部分新增状态变量
const qrcodeStatus = ref('unscanned') // 状态：unscanned/waiting/confirmed/expired

// 修改扫码登录方法
const handleQrcodeLogin = async () => {
  try {
    showQrcode.value = true
    qrcodeStatus.value = 'unscanned'
    const response = await generateQrCode()
    qrcodeId.value = response.data;
    // 模拟生成二维码
    qrcodeUrl.value = `${import.meta.env.VITE_QRCODE_BASE_URL}${qrcodeId.value}`;
    console.log(qrcodeUrl.value);
    startPolling('mock_ticket')
  } catch (error) {
    console.error(error)
    ElMessage.error('二维码获取失败')
    showQrcode.value = false
  }
}

// 完善轮询逻辑
// 轮询获取扫描状态
const startPolling = (ticket: string) => {
  const interval = setInterval(async () => {
    if (showQrcode.value === false) {
      clearInterval(interval)
      return;
    }

    try {
      const response = await qrCoderStatus(qrcodeId.value)
      let codeScanStatus = response.data.qrCodeStatus;
      // console.log(response)
      // 二维码过期
      if (codeScanStatus === -1) {
        clearInterval(interval)
        qrcodeStatus.value = 'expired'
        ElMessage.warning('二维码已失效或已过期')
        return
      }

      // 第一次扫码成功，等待确认
      if (codeScanStatus === 1) {
        qrcodeStatus.value = 'waiting'
        return
      }

      // 用户已确认
      if (codeScanStatus === 2) {
        clearInterval(interval)
        qrcodeStatus.value = 'confirmed'
        Cookies.remove("loginToken");
        Cookies.set("loginToken", response.data.token)
        router.push('/')
        ElMessage.success("登录成功")
      }
    } catch (error) {
      console.log(error);
    }
  }, 1500)
}

// 新增刷新二维码方法
const refreshQrcode = () => {
  qrcodeStatus.value = 'unscanned'
  handleQrcodeLogin()
}


// 新增注册相关状态
const isRegisterMode = ref(false);
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
});

// 新增注册方法
const register = async () => {
  // 表单验证
  if (registerForm.value.username === "" || registerForm.value.password === "") {
    ElMessage.error("用户名或密码不能为空");
    return;
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    ElMessage.error("两次输入的密码不一致");
    return;
  }
  
  if (registerForm.value.email && !validateEmail(registerForm.value.email)) {
    ElMessage.error("邮箱格式不正确");
    return;
  }
  
  // 调用实际的注册API
  try {
    const response = await userRegister({
      username: registerForm.value.username,
      password: registerForm.value.password,
      email: registerForm.value.email || undefined
    });
    
    if (response && response.code === 200) {
      ElMessage.success("注册成功，请登录");
      isRegisterMode.value = false; // 切换回登录模式
      loginForm.value.username = registerForm.value.username; // 自动填充用户名
    } else {
      ElMessage.error(response?.msg || "注册失败，请稍后再试");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("注册失败，请稍后再试");
  }
};

// 邮箱验证函数
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// 切换到注册模式
const switchToRegister = () => {
  isRegisterMode.value = true;
  showQrcode.value = false;
};

// 切换到登录模式
const switchToLogin = () => {
  isRegisterMode.value = false;
  showQrcode.value = false;
};


</script>

<template>
  <div class="poster">

    <div class="login-container">

      <!-- 海报背景图片 -->
      <div class="login-image"></div>

      <!-- 登录大表单 -->
      <div class="login-form">

        <!-- 表单登录 -->
        <div v-if="!showQrcode && !isRegisterMode">
          <el-form label-position="left" label-width="0px">
            <el-form-item>
              <el-input type="link" v-model="loginForm.username" auto-complete="off" placeholder="请输入账号"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="password" v-model="loginForm.password" auto-complete="off" placeholder="请输入密码"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="link" placeholder="请输入验证码" suffix-icon="el-icon-refresh" class="std-input-height">
                <template #append>
                  <img :src="verityImg" alt="验证码" class="captcha-image" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item class="form-item-flex-space-between">
              <div class="forgot-password-container"><a href="#" class="forgot-password-link">忘记密码</a></div>
            </el-form-item>

            <el-form-item class="form-item-full-width">
              <el-button type="primary" class="login-button"
                @click="login">立即登录</el-button>
            </el-form-item>
            
            <el-form-item class="form-item-centered-text">
              <span class="register-link">没有账号？<a href="javascript:void(0)" @click="switchToRegister">立即注册</a></span>
              <span  @click="handleQrcodeLogin">扫码登录</span>
            </el-form-item>

          </el-form>
        </div>


      <!-- 注册表单 -->
      <div v-if="isRegisterMode">
          <el-form label-position="left" label-width="0px">
            <el-form-item>
              <el-input type="link" v-model="registerForm.username" auto-complete="off" placeholder="请输入用户名"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="password" v-model="registerForm.password" auto-complete="off" placeholder="请输入密码"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="password" v-model="registerForm.confirmPassword" auto-complete="off" placeholder="请确认密码"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="email" v-model="registerForm.email" auto-complete="off" placeholder="请输入邮箱(选填)"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item class="form-item-full-width">
              <el-button type="primary" class="register-button"
                @click="register">立即注册</el-button>
            </el-form-item>

            <el-form-item class="form-item-centered-text">
              <span class="login-link">已有账号？<a href="javascript:void(0)" @click="switchToLogin">立即登录</a></span>
            </el-form-item>
          </el-form>
        </div>


           <!-- 二维码登录 -->
           <div v-if="showQrcode" class="qrcode-container">
          <QRCode :value="qrcodeUrl" :size="200" class="qrcode" v-loading="!qrcodeUrl" />
          <div class="qrcode-tip">
            <template v-if="qrcodeStatus === 'unscanned'">
              请使用微信扫描二维码
            </template>
            <template v-else-if="qrcodeStatus === 'waiting'">
              <i class="el-icon-loading"></i>
              已扫描，等待用户确认...
            </template>
            <template v-else-if="qrcodeStatus === 'confirmed'">
              登录成功，跳转中...
            </template>
            <template v-else-if="qrcodeStatus === 'expired'">
              <div class="expired-panel">
                <p>二维码已过期</p>
                <el-button type="primary" size="small" @click="refreshQrcode" class="refresh-qrcode-button">
                  刷新二维码
                </el-button>
              </div>
            </template>

            <div @click="switchToLogin">返回</div>

          </div>
        </div>

        <!-- 其他登录方式 -->
        <div v-if="!isRegisterMode" class="divider">其他登录方式</div>
        <div v-if="!isRegisterMode" class="other-login-methods">
          <el-button class="other-login-button">邮箱登录</el-button>
          <el-button class="other-login-button">微信登录</el-button>
          <el-button class="other-login-button">QQ登录</el-button>
        </div>

      </div>
    </div>
  </div>

  <!-- 滑块验证码 -->
  <Vcode :show="isShow" @success="success" @close="close" @fail="fail"
    :imgs="[Img01, Img02, Img03, Img04, Img05, Img06]">
  </Vcode>

</template>

<style scoped>
.poster {
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, rgba(255,237,237,0.8) 0%, rgba(187,236,255,0.5) 100%);
  background-size: cover;
  position: fixed;
  animation: gradientAnimation 15s ease infinite;
}

@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.login-container {
  border-radius: 15px;
  background-clip: padding-box;
  margin: 15vh auto;
  width: 850px;
  max-width: 90%;
  background: #fff;
  border: 1px solid #eaeaea;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  overflow: hidden;
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.8s ease forwards;
}

@keyframes fadeInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.login-image {
  flex: 1;
  background-image: url('@/assets/img/login_bg1.png');
  background-position: center;
  background-size: cover;
}

.login-form {
  flex: 1;
  padding: 30px 40px; /* 调整内边距 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-tabs {
  display: flex;
  justify-content: center; /* 居中显示 */
  margin-bottom: 25px; /* 增加底部间距 */
  gap: 20px; /* 增加选项卡之间的间距 */
}

.login-tabs span {
  cursor: pointer;
  color: #007bff;
  padding: 8px 15px;
  border-radius: 5px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}



.login-tabs span:hover {
  background-color: #f0f0f0; /* 鼠标悬停背景色 */
}

.login-tabs .active {
  font-weight: bold;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12); /* 为激活标签添加阴影 */
  transform: translateY(-2px); /* 轻微上移激活标签 */
}

.divider {
  border-top: 1px solid #eaeaea;
  margin: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888;
  font-size: 14px;
}

.other-login-methods {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.other-login-button {
  font-size: 14px;
  color: #007bff;
  border: 1px solid #007bff !important; /* 添加边框, 使用!important确保覆盖element-plus默认样式 */
  background: none;
  padding: 8px 15px; /* 调整内边距 */
  border-radius: 5px; /* 添加圆角 */
  transition: background-color 0.3s ease, color 0.3s ease; /* 添加过渡效果 */
}

.other-login-button {
  font-size: 14px;
  color: #007bff;
  border: 1px solid #007bff !important;
  background: none;
  padding: 8px 15px;
  border-radius: 5px;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease; /* Added transform and box-shadow transitions */
  cursor: pointer; /* Added cursor pointer */
}

.other-login-button:hover {
  background-color: #007bff !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* Added subtle shadow on hover */
}

.other-login-button:focus {
  background-color: #007bff !important;
  color: #fff !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.35); /* Focus ring similar to main buttons */
  outline: none;
}

.other-login-button:active {
  background-color: #0056b3 !important; /* Darker shade for active, consistent with main buttons' hover */
  color: #fff !important;
  transform: scale(0.97); /* Slightly shrink on active */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); /* Slightly reduced shadow for active */
}

.expired-panel {
  color: #f56c6c;
  text-align: center;
  padding: 10px;

  p {
    margin-bottom: 5px;
  }
}

.qrcode-tip {
  min-height: 60px;
  margin-top: 15px;
  text-align: center;
  color: #666;

  .el-icon-loading {
    margin-right: 5px;
    animation: rotating 2s linear infinite;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}


.login-link, .register-link {
  font-size: 14px;
  color: #666;
}

.login-link a, .register-link a {
  color: #007bff;
  text-decoration: none;
  margin-left: 5px;
  transition: color 0.3s ease; /* 添加颜色过渡效果 */
}

.login-link a:hover, .register-link a:hover {
  text-decoration: underline;
  color: #0056b3; /* 鼠标悬停时加深颜色 */
}


/* 新增移动端样式 */
@media (max-width: 768px) {
  .poster {
    display: flex;
    align-items: center;
  }

  .login-container {
    margin: auto;
    /* 修改此处实现垂直居中 */
    width: 90%;
    min-height: auto;
    flex-direction: column;
  }

  .login-image {
    display: none;
  }

  .login-form {
    padding: 20px;
    width: 100%;
  }

  .poster {
    background: linear-gradient(to bottom, rgb(255 237 237 / 80%), rgb(187 236 255 / 50%));
  }

  .login-tabs {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 10px;
  }
  
  .login-tabs span {
    padding: 5px 10px;
  }


  /* 新增二维码适配 */
  .qrcode-container {
    padding: 10px;

    .qrcode {
      width: 80% !important;
    }
  }
}

/* 新增二维码样式 */
.qrcode-container {
  min-height: 280px;
  padding: 10px;

  .qrcode {
    width: 70% !important;
    max-width: 200px;
  }
}

/* Login and Register Button Styles */
.login-button,
.register-button {
  border: none;
  width: 100%;
  height: 45px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: white !important;
  background-color: #007bff;
  cursor: pointer;
  border-radius: 5px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.login-button::before,
.register-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #007bff, #00bfff);
  z-index: -1;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.login-button:hover::before,
.register-button:hover::before {
  opacity: 0.8;
}

.login-button:hover,
.register-button:hover {
  background-color: #0056b3 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Softer shadow on hover */
}

.login-button:focus,
.register-button:focus {
  background-color: #0056b3 !important; /* Consistent with hover */
  box-shadow: 0 0 0 0.2rem rgba(38, 143, 255, 0.5); /* Adjusted focus ring color */
  outline: none;
}

.login-button:active,
.register-button:active {
  background-color: #004085 !important;
  transform: scale(0.98); /* Slightly shrink on active */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15); /* Slightly reduced shadow for active */
}

/* Standard Input Height */
.std-input-height {
  height: 45px;
}

/* Captcha Image Styling */
.captcha-image {
  width: 80px;
  height: 40px;
  vertical-align: middle;
}

/* Flex Form Item for Remember Me and Forgot Password */
.form-item-flex-space-between {
  width: 100%;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.remember-me-checkbox {
  flex: 1 !important;
}

.forgot-password-container {
  flex: 1 !important;
  text-align: right !important;
}

.forgot-password-link {
  color: #007bff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Refresh QR Code Button Margin */
.refresh-qrcode-button {
  margin-top: 10px;
}

/* Form Item Centered Text */
.form-item-centered-text {
  width: 100%;
  text-align: center;
}

/* Form Item Full Width */
.form-item-full-width {
  width: 100%;
}
</style>