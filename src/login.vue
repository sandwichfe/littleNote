<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { userLogin } from '@/network/base';
import Cookies from 'js-cookie';
import Vcode from 'vue3-puzzle-vcode';
import Img01 from "@/assets/img/login_bg.png";
import Img02 from "@/assets/img/login_bg1.png";

const router = useRouter();

const loginForm = ref({
  username: '',
  password: ''
});

const isShow = ref(false);

const loginToken = ref("");

const login = async () => {
  if (loginForm.value.username === "" || loginForm.value.password === "") {
    ElMessage.error("用户名或密码不能为空");
    return;
  } else {
    userLogin(loginForm.value.username, loginForm.value.password).then((res) => {
      if (res) {
        if (res.code == 200) {
          // ElMessage.success(res.msg);
          loginToken.value = res.data;
          isShow.value = true;
        } else {
          ElMessage.error(res.msg || "登录失败，请检查用户名或密码"); // 提示失败信息
        }
      }
    });
  }
};

const success = (msg) => {
  isShow.value = false;
  ElMessage.success("验证通过");
  // 验证通过后跳转到首页
  Cookies.remove("loginToken");  
  Cookies.set("loginToken", loginToken.value, { expires: 7 }); //存cookies  过期时间为7天
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
  <body id="poster">
    <el-form class="login-container" label-position="left" label-width="0px" @submit.prevent="login">
      <h3 class="login_title">系统登录</h3>
      <el-form-item>
        <el-input type="text" v-model="loginForm.username" auto-complete="on" placeholder="账号"
          name="username"></el-input>
      </el-form-item>

      <el-form-item>
        <el-input type="password" v-model="loginForm.password" auto-complete="on" placeholder="密码"
          name="password"></el-input>
      </el-form-item>

      <el-form-item style="width: 100%">
        <el-button type="primary" style="width: 100%; background: rgb(175 186 197); border: none"
          @click="login">登录</el-button>
      </el-form-item>
    </el-form>

    <Vcode
      :show="isShow"
      @success="success"
      @close="close"
      @fail="fail"
      :imgs="[Img01, Img02]"
    ></Vcode>
  </body>
</template>

<style scoped>
#poster {
  background-position: center;
  height: 100%;
  width: 100%;
  background-size: cover;
  position: fixed;
}

body {
  margin: 0px;
  padding: 0;
}

.login-container {
  border-radius: 15px;
  background-clip: padding-box;
  margin: 90px auto;
  width: 350px;
  padding: 35px 35px 15px 35px;
  background: #fff;
  border: 1px solid #eaeaea;
  box-shadow: 0 0 25px #cac6c6;
}

.login_title {
  margin: 0px auto 40px auto;
  text-align: center;
  color: #505458;
}
</style>