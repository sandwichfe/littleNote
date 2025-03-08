<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { userLogin } from '@/network/base';
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
import { qrCoderStatus } from '@/network/base';

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

// 在script部分新增状态变量
const qrcodeStatus = ref('unscanned') // 状态：unscanned/waiting/confirmed/expired

// 修改现有扫码登录方法
// 修改扫码登录方法
const handleQrcodeLogin = async () => {
  try {
    showQrcode.value = true
    qrcodeStatus.value = 'unscanned'
    // 模拟生成二维码
    qrcodeUrl.value = "https://blog.csdn.net/Dandrose"
    startPolling('mock_ticket')
  } catch (error) {
    console.error(error)
    ElMessage.error('二维码获取失败')
    showQrcode.value = false
  }
}

// 完善轮询逻辑
// 修改轮询逻辑模拟等待确认
const startPolling = (ticket: string) => {
  const interval = setInterval(async () => {
    if(showQrcode.value === false){
      clearInterval(interval)
      return;
    }

    try {
      const response = await qrCoderStatus('1111')
      let codeScanStatus = response.data.qrCodeStatus;  
      console.log(response)
      // 二维码过期
      if (codeScanStatus === -1) {
        clearInterval(interval)
        qrcodeStatus.value = 'expired'
        ElMessage.warning('二维码已失效或已过期')
        return
      }

      // 模拟第一次扫码成功，等待确认
      if (codeScanStatus === 1) {
        qrcodeStatus.value = 'waiting'
        return
      }

      // 模拟用户已确认
      if (codeScanStatus === 2) {
        clearInterval(interval)
        qrcodeStatus.value = 'confirmed'
        Cookies.set("loginToken", 'mock_token')
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

</script>

<template>
  <div class="poster">

    <div class="login-container">

      <!-- 海报背景图片 -->
      <div class="login-image"></div>

      <!-- 登录大表单 -->
      <div class="login-form">
        <div class="login-tabs">
          <span :class="{ active: !showQrcode }" @click="showQrcode = false">账号登录</span>
          <span :class="{ active: showQrcode }" @click="handleQrcodeLogin">扫码登录</span>
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
                <el-button type="primary" size="small" @click="refreshQrcode" style="margin-top: 10px;">
                  刷新二维码
                </el-button>
              </div>
            </template>
          </div>
        </div>

        <!-- 表单登录 -->
        <div v-if="!showQrcode">
          <el-form label-position="left" label-width="0px">
            <el-form-item>
              <el-input type="link" v-model="loginForm.username" auto-complete="off" placeholder="请输入账号"
                style="height: 40px;"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="password" v-model="loginForm.password" auto-complete="off" placeholder="请输入密码"
                style="height: 40px;"></el-input>
            </el-form-item>

            <el-form-item>
              <el-input type="link" placeholder="请输入验证码" suffix-icon="el-icon-refresh" style="height: 40px;">
                <template #append>
                  <img :src="verityImg" alt="验证码" style="width: 80px;height: 40px;" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item
              style="width: 100%; display: flex!important; justify-content: space-between!important; align-items: center!important;">
              <div style="flex: 1!important;"><el-checkbox v-model="loginForm.remember">记住我</el-checkbox></div>
              <div style="flex: 1!important;text-align: right!important;"><a href="#">忘记密码</a></div>
            </el-form-item>

            <el-form-item style="width: 100%">
              <el-button type="primary" style=" background: #007bff; border: none; width: 100%;height: 40px;"
                v-on:click="login">立即登录</el-button>
            </el-form-item>
          </el-form>
        </div>


        <div class="divider">其他登录方式</div>
        <div class="other-login-methods">
          <el-button>邮箱登录</el-button>
          <el-button>微信登录</el-button>
          <el-button>QQ登录</el-button>
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
  background: linear-gradient(to right, rgb(255 237 237 / 80%), rgb(187 236 255 / 50%));
  background-size: cover;
  position: fixed;
}

.login-container {
  border-radius: 15px;
  background-clip: padding-box;
  margin: 260px auto;
  width: 850px;
  background: #fff;
  border: 1px solid #eaeaea;
  box-shadow: 0 0 25px #cac6c6;
  display: flex;
}

.login-image {
  flex: 1;
  background-image: url('@/assets/img/login_bg1.png');
  background-position: center;
  background-size: cover;
}

.login-form {
  flex: 1;
  padding: 40px;
}

.login-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.login-tabs span {
  cursor: pointer;
  color: #007bff;
}

.login-tabs .active {
  color: #333;
  font-weight: bold;
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

.other-login-methods .el-button {
  font-size: 14px;
  color: #007bff;
  border: none;
  background: none;
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
    flex-direction: column;
    gap: 10px;
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
</style>