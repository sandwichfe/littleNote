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

import QRCode from '@/components/QRCode.vue';
import { userLogin, generateQrCode, qrCoderStatus, userRegister } from '@/network/base';
import { useMenuStore } from '@/store/menu';
import { openLoading, closeLoading } from "@/utils/loadingUtil";
import { RefreshRight, ArrowLeft } from '@element-plus/icons-vue';


onMounted(() => {
  // 访问登录页面  清除token
  Cookies.remove("loginToken");
});

const router = useRouter();
const menuStore = useMenuStore();

const loginForm = ref({
  username: '',
  password: '',
  remember: false
});

const isShow = ref(false);

const loginToken = ref("");

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
  openLoading('o(*≧▽≦)ツ加载中~');
    // 登录请求
userLogin(loginForm.value.username, loginForm.value.password)
  .then(async (res) => {
    if (res && res.code === 200) {
      // 登录成功处理
      loginToken.value = res.data;
      Cookies.set("loginToken", loginToken.value, { expires: 7 });
      // 获取菜单和路由
      const { success, message } = await menuStore.fetchAndSetMenus();
      if (success) {
        router.push('/');
        ElMessage.success("登录成功");
      } else {
        ElMessage.error(message || '菜单加载失败');
        // 清除token
        Cookies.remove("loginToken");
      }
    } else {
      // 登录失败处理（业务错误）
      const errorMessage = res?.msg || '登录失败';
      ElMessage.error(errorMessage);
      
      // 清除可能存在的旧token
      Cookies.remove("loginToken");
    }
  })
  .catch(error => {
    // 处理请求错误
    const errorMessage = error?.response?.data?.msg 
      || error?.message 
      || '登录请求失败，请稍后重试';
    ElMessage.error(errorMessage);
  })
  .finally(() => {
    closeLoading();
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
        Cookies.set("loginToken", response.data.token)
        
        // 获取菜单和路由
        const { success, message } = await menuStore.fetchAndSetMenus();
        if(success){
          router.push('/')
          ElMessage.success("登录成功")
        } else {
          ElMessage.error(message || '菜单加载失败');
          Cookies.remove("loginToken");
        }
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
  // 清空登录表单
  registerForm.value.username = ''
  registerForm.value.password = ''
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
        <div v-if="!showQrcode && !isRegisterMode" class="account-login-form">
          <el-form label-position="left" label-width="0px" class="login-el-form">
            <el-form-item>
              <el-input type="text" v-model="loginForm.username"  placeholder="请输入账号"
                class="std-input-height"></el-input>
            </el-form-item>

            <el-form-item class="password-with-forgot-link">
              <el-input type="password" v-model="loginForm.password"  placeholder="请输入密码"
                class="std-input-height">
              </el-input>
              <a href="#" class="forgot-password-link-inline">忘记密码?</a>
            </el-form-item>

            <el-form-item class="form-item-full-width">
              <el-button type="primary" class="login-button"
                @click="login">立即登录</el-button>
            </el-form-item>
            
            <el-form-item class="form-item-centered-text">
              <span  @click="handleQrcodeLogin">扫码登录</span>
              <span class="register-link">没有账号？<a href="javascript:void(0)" @click="switchToRegister">立即注册</a></span>
            </el-form-item>

          </el-form>
        </div>


        <!-- 二维码登录 -->
        <div v-if="showQrcode" class="qrcode-container animated-qrcode">
          <!-- 返回按钮 -->
          <div class="back-button" @click="switchToLogin">
            <el-icon><ArrowLeft /></el-icon>
          </div>

          <div class="qrcode-wrapper">
            <QRCode :value="qrcodeUrl" :size="200" class="qrcode" v-loading="!qrcodeUrl" />
            <el-icon class="refresh-icon" @click="refreshQrcode" v-if="qrcodeStatus !== 'expired'"><RefreshRight /></el-icon>
            <div v-if="qrcodeStatus === 'expired'" class="expired-overlay">
              <p>二维码已过期</p>
              <el-button type="primary" size="small" @click="refreshQrcode" class="refresh-qrcode-button-overlay">
                点击刷新
              </el-button>
            </div>
          </div>
          <div class="qrcode-tip">
            <template v-if="qrcodeStatus === 'unscanned'">
              请扫描二维码
            </template>
            <template v-else-if="qrcodeStatus === 'waiting'">
              <i class="el-icon-loading"></i>
              已扫描，等待用户确认...
            </template>
            <template v-else-if="qrcodeStatus === 'confirmed'">
              登录成功，跳转中...
            </template>
          </div>
        </div>


      <!-- 注册表单 -->
      <div v-if="isRegisterMode">
          <el-form label-position="left" label-width="0px" class="login-el-form">
            <el-form-item>
              <el-input type="link" v-model="registerForm.username"  placeholder="请输入用户名"
                class="std-input-height" autocomplete="off"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="password" v-model="registerForm.password"  placeholder="请输入密码"
                class="std-input-height" autocomplete="new-password"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="password" v-model="registerForm.confirmPassword"  placeholder="请确认密码"
                class="std-input-height" autocomplete="new-password"></el-input>
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
  height: 600px; /* Added to stabilize container height for consistent image size */
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
  background-image: url('@/assets/img/login_bg1.jpg');
  background-position: center;
  background-size: cover;
}

.login-form {
  flex: 1;
  padding: 30px 40px; /* 调整内边距 */
  display: flex;
  flex-direction: column;
  /* justify-content: center; */ /* Removed to prevent tabs from shifting */
}


/* Add animation and spacing to form items */
.account-login-form {
  margin-top: 45px; /* Increased margin to push the form down further */
}

.login-el-form .el-form-item {
  margin-bottom: 22px; /* Increased bottom margin */
  opacity: 0;
  transform: translateY(10px);
  animation: formItemFadeIn 0.5s ease forwards;
}

/* Stagger animation for form items */
.login-el-form .el-form-item:nth-child(1) { animation-delay: 0.1s; }
.login-el-form .el-form-item:nth-child(2) { animation-delay: 0.2s; }
.login-el-form .el-form-item:nth-child(3) { animation-delay: 0.3s; }
.login-el-form .el-form-item:nth-child(4) { animation-delay: 0.4s; }
.login-el-form .el-form-item:nth-child(5) { animation-delay: 0.5s; }

@keyframes formItemFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style input fields */
.std-input-height .el-input__wrapper {
  border-radius: 5px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.std-input-height .el-input__wrapper:hover {
  border-color: #007bff;
}

.std-input-height .el-input__wrapper.is-focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
  flex: 1 !important;
  text-align: right !important;
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
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中（如果需要） */
  min-height: 280px;
  padding: 20px 10px; /* 增加上下内边距 */
  position: relative; /* 为返回按钮定位 */
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  opacity: 0;
  transform: translateX(-10px);
  animation: slideInLeft 0.4s ease-out forwards;
}

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.back-button:hover {
  background-color: rgba(0, 123, 255, 0.1);
  transform: scale(1.1);
}

.back-button:active {
  background-color: rgba(0, 123, 255, 0.2);
  transform: scale(0.95);
}

.back-button .el-icon {
  font-size: 20px;
  color: #333;
  transition: color 0.3s ease;
}

.back-button:hover .el-icon {
  color: #007bff;
}

.qrcode-wrapper {
  position: relative;
  display: flex; /* 改为flex布局，使其包裹内部元素 */
  justify-content: center; /* 水平居中二维码本身 */
  align-items: center; /* 垂直居中二维码本身 */
  margin-bottom: 15px; /* 二维码和提示文字的间距 */
  /* width: 200px; */ /* 可以考虑给wrapper一个固定宽度，如果二维码大小固定 */
  /* height: 200px; */ /* 可以考虑给wrapper一个固定高度 */
}

.animated-qrcode .qrcode-wrapper .qrcode {
  /* 移除之前的动画属性，因为动画现在应用在wrapper内的qrcode上 */
  width: 100% !important; /* 让二维码填充wrapper */
  max-width: 200px; /* 保持最大宽度限制 */
  display: block;
}

.animated-qrcode .qrcode-wrapper > .qrcode {
  opacity: 0;
  transform: scale(0.8);
  animation: fadeInUp 0.5s ease-out forwards;
  animation-delay: 0.1s;
  /* width: 70% !important; */ /* 宽度由wrapper控制 */
  /* max-width: 200px; */
  display: block; /* 确保二维码是块级元素，以便覆盖层能正确工作 */
}

.refresh-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 50px; /* 调大图标 */
  color: #fff;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 15px; /* 增加内边距，使点击区域更大 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
  z-index: 10;
  opacity: 0;
}

.qrcode-wrapper:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3); /* 半透明黑色遮罩 */
  border-radius: 8px; /* 与二维码或wrapper的圆角保持一致 */
  z-index: 5; /* 在二维码之上，在刷新按钮之下 */
  opacity: 1;
  transition: opacity 0.3s ease;
}

.qrcode-wrapper:hover .refresh-icon {
  opacity: 1; /* 鼠标悬浮时显示 */
  z-index: 10; /*确保刷新按钮在遮罩之上*/
}

.expired-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; /* 确保覆盖整个wrapper */
  height: 100%; /* 确保覆盖整个wrapper */
  background-color: rgba(0, 0, 0, 0.8); /* 加深背景 */
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-radius: 8px; /* 可以给覆盖层一个圆角，如果二维码本身没有 */
  opacity: 0;
  animation: fadeIn 0.3s forwards;
  z-index: 20; /* 比刷新图标更高，确保覆盖 */
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.refresh-qrcode-button-overlay {
  margin-top: 10px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animated-qrcode .qrcode-tip {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.5s ease-out forwards;
  animation-delay: 0.3s; /* 在二维码动画之后开始 */
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
.password-with-forgot-link {
  position: relative;
}

.forgot-password-link-inline {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
}

.forgot-password-link-inline:hover {
  text-decoration: underline;
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
  margin-top: 5px; /* Adjust top margin for the login button container */
}

.form-item-centered-text {
  margin-top: 15px; /* Add some top margin to the register/login link container */
}
</style>