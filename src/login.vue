<template>
  <body id="poster">
    <el-form class="login-container" label-position="left" label-width="0px">
      <h3 class="login_title">系统登录</h3>
      <el-form-item>
        <el-input
          type="text"
          v-model="loginForm.username"
          auto-complete="off"
          placeholder="账号"
        ></el-input>
      </el-form-item>

      <el-form-item>
        <el-input
          type="password"
          v-model="loginForm.password"
          auto-complete="off"
          placeholder="密码"
        ></el-input>
      </el-form-item>

      <el-form-item style="width: 100%">
        <el-button
          type="primary"
          style="width: 100%; background: rgb(175 186 197); border: none"
          v-on:click="login"
          >登录</el-button
        >
      </el-form-item>
    </el-form>
  </body>
</template>
 
 
<script>
import { login } from "@/network/base";
import Cookies from 'js-cookie'
export default {
  name: "Login",
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
      responseResult: [],
    };
  },
  methods: {
    login() {
      login(this.loginForm.username, this.loginForm.password).then((res) => {
        console.log(res);
        if (res) {
          if (res.code == 200) {
            // this.$store.commit("setNewToken", res.data);
            Cookies.remove("loginToken");  
            Cookies.set("loginToken",res.data,{ expires: 7 }); //存cookies  过期时间为7天
            this.$router.push("/")
            this.$message.success(res.msg)
          }else {
              // 处理登录失败的情况
               this.$message.error(res.msg || "登录失败，请检查用户名或密码"); // 提示失败信息
              }
        }
      });
    },
  },
};
</script>
 
<style>
#poster {
  /* background:url("../assets/eva.jpg") no-repeat; */
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