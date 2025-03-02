<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { userLogin } from '@/network/base';
import Cookies from 'js-cookie';
import Vcode from 'vue3-puzzle-vcode';
import Img01 from "@/assets/img/login_bg.png";
import Img02 from "@/assets/img/login_bg1.png";
// 使用 import 语法引入图片路径
import verityImgPath from '@/assets/img/login_bg1.png';

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
    userLogin(loginForm.value.username, loginForm.value.password).then((res) => {
      if (res) {
        if (res.code == 200) {
          loginToken.value = res.data;
          isShow.value = true;
        } else {
          ElMessage.error(res.msg || "登录失败，请检查用户名或密码");
        }
      }
    });
  }
};

const success = (msg) => {
  isShow.value = false;
  ElMessage.success("验证通过");
  Cookies.remove("loginToken");
  Cookies.set("loginToken", loginToken.value, { expires: 7 });
  router.push('/');
};

const close = () => {
  isShow.value = false;
};

const fail = () => {
  ElMessage.error("验证失败");
};
</script>

<template>
  <div class="poster">
    <div class="login-container">
      <div class="login-image"></div>
      <div class="login-form">
        <div class="login-tabs">
          <span class="active">账号登录</span>
          <span>手机号登录</span>
        </div>
        <el-form label-position="left" label-width="0px">
          <el-form-item>
            <el-input
              type="text"
              v-model="loginForm.username"
              auto-complete="off"
              placeholder="请输入账号"
              style="height: 40px;"
            ></el-input>
          </el-form-item>

          <el-form-item>
            <el-input
              type="password"
              v-model="loginForm.password"
              auto-complete="off"
              placeholder="请输入密码"
              style="height: 40px;"
            ></el-input>
          </el-form-item>

          <el-form-item>
            <el-input
              type="text"
              placeholder="请输入验证码"
              suffix-icon="el-icon-refresh"
              style="height: 40px;"
            >
              <template #append>
                <img :src="verityImg" alt="验证码" style="width: 80px;height: 40px;"/>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item style="width: 100%; display: flex!important; justify-content: space-between!important; align-items: center!important;">
            <div style="flex: 1!important;"><el-checkbox v-model="loginForm.remember">记住我</el-checkbox></div>
            <div style="flex: 1!important;text-align: right!important;"><a href="#" >忘记密码</a></div>
          </el-form-item>

          <el-form-item style="width: 100%">
            <el-button
              type="primary"
              style=" background: #007bff; border: none; width: 100%;height: 40px;"
              v-on:click="login"
            >立即登录</el-button>
          </el-form-item>
        </el-form>

        <div class="divider">其他登录方式</div>

        <div class="other-login-methods">
          <el-button type="text" icon="el-icon-message">邮箱登录</el-button>
          <el-button type="text" icon="el-icon-s-wechat">微信登录</el-button>
          <el-button type="text" icon="el-icon-user-solid">QQ登录</el-button>
        </div>
      </div>
    </div>
  </div>
  <Vcode
      :show="isShow"
      @success="success"
      @close="close"
      @fail="fail"
      :imgs="[Img01, Img02]"
    ></Vcode>
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
</style>