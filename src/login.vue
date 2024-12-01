<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import axios from 'axios'

import { ElMessage } from 'element-plus' 

// 定义登录提交的对象
const loginModel = ref({
  code: '',
  username: '',
  password: '',
  loginType: '',
  captchaId: '',
  nonce: getQueryString('nonceId')
})

// 图形验证码的base64数据
let captchaImage = ref('')
// 图形验证码的值
let captchaCode = ''
// 是否开始倒计时
const counterActive = ref(false)

/**
 * 获取图形验证码
 */
const getCaptcha = () => {
  axios({
    method: 'GET',
    url: 'http://192.168.1.102:8080/getCaptcha'
  }).then((r) => {
    let result = r.data
    if (result.success) {
      captchaCode = result.data.code
      captchaImage.value = result.data.imageData
      loginModel.value.captchaId = result.data.captchaId
    } else {
        ElMessage.warning(result.message)
    }
  })
}

/**
 * 提交登录表单
 */
const submitLogin = () => {
  loginModel.value.loginType = 'passwordLogin'
  axios({
    method: 'post',
    url: 'http://oauth.local.server:9000/login',
    headers: {
      nonceId: loginModel.value.nonce,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: loginModel.value
  }).then((r) => {
    let result = r.data
    if (result.success) {
      // message.info(`登录成功`)
      let target = getQueryString('target')
      if (target) {
        window.location.href = target
      }
    } else {
        ElMessage.warning(result.message)
    }
  })
}

/**
 * 提交短信登录表单
 */
const submitSmsLogin = () => {
  loginModel.value.loginType = 'smsCaptcha'
  axios({
    method: 'post',
    url: 'oauth.local.server:9000/login',
    headers: {
      nonceId: loginModel.value.nonce,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: loginModel.value
  }).then((r) => {
    let result = r.data
    if (result.success) {
        ElMessage.info(`登录成功`)
      let target = getQueryString('target')
      if (target) {
        window.location.href = target
      }
    } else {
        ElMessage.warning(result.message)
    }
  })
}

/**
 * 获取短信验证码
 */
const getSmsCaptcha = () => {
  if (!loginModel.value.username) {
    ElMessage.warning('请先输入手机号.')
    return
  }
  if (!loginModel.value.code) {
    ElMessage.warning('请先输入验证码.')
    return
  }
  if (loginModel.value.code !== captchaCode) {
    ElMessage.warning('验证码错误.')
    return
  }
  axios({
    method: 'get',
    url: `http://192.168.1.102:8080/getSmsCaptcha?phone=${loginModel.value.username}`
  }).then((r) => {
    let result = r.data
    if (result.success) {
        ElMessage.info(`获取短信验证码成功，固定为：${result.data}`)
      counterActive.value = true
    } else {
        ElMessage.warning(result.message)
    }
  })
}



/**
 * 获取地址栏参数
 * @param name 地址栏参数的key
 */
function getQueryString(name: string) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')

  var r = window.location.search.substr(1).match(reg)

  if (r != null) {
    return unescape(r[2])
  }

  return null
}

</script>

<template>
    <div>
      <header>
        <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
        <div class="wrapper">
          <HelloWorld msg="统一认证平台" />
        </div>
      </header>
  
      <main>
        <el-card>
          <el-tabs
            v-model="activeTab"
            size="large"
            type="card"
            @tab-click="handleUpdateValue"
          >
            <!-- 账号登录 Tab -->
            <el-tab-pane label="账号登录" name="signin">
              <el-form :model="loginModel">
                <el-form-item label="用户名">
                  <el-input
                    v-model="loginModel.username"
                    placeholder="手机号 / 邮箱"
                  />
                </el-form-item>
  
                <el-form-item label="密码">
                  <el-input
                    v-model="loginModel.password"
                    type="password"
                    show-password
                    placeholder="密码"
                  />
                </el-form-item>
  
              </el-form>
              <el-button type="primary" @click="submitLogin" block> 登录 </el-button>
            </el-tab-pane>
  
            <!-- 短信登录 Tab -->
            <el-tab-pane label="短信登录" name="signup">
              <el-form :model="loginModel">
                <el-form-item label="手机号">
                  <el-input
                    v-model="loginModel.username"
                    placeholder="手机号 / 邮箱"
                  />
                </el-form-item>
  
  
                <el-form-item label="短信验证码">
                  <el-input-group>
                    <el-input
                      v-model="loginModel.password"
                      placeholder="请输入验证码"
                    />
                    <el-button
                      type="info"
                      @click="getSmsCaptcha"
                      :disabled="counterActive"
                      style="width: 130px"
                    >
                      获取验证码
                      <span v-if="counterActive">
                        (
                        <el-countdown
                          :time="countdownTime"
                          :active="counterActive"
                          :format="countdownFormat"
                          @finish="onFinish"
                        />
                        )
                      </span>
                    </el-button>
                  </el-input-group>
                </el-form-item>
              </el-form>
              <el-button type="primary" @click="submitSmsLogin" block> 登录 </el-button>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </main>
    </div>
  </template>
  
 
<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>