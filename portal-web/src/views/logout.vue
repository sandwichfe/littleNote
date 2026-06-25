<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { useMenuStore } from '@/store/menu'

const router = useRouter()
const menuStore = useMenuStore()

onMounted(() => {
  // 清除登录状态
  menuStore.resetMenuState()
  Cookies.remove('loginToken')

  // 跳转到登录页
  router.push('/login')
})
</script>

<template>
  <div style="text-align: center; padding: 50px;">
    <p>正在退出...</p>
  </div>
</template>
