import { createRouter } from 'vue-router'
import { isAuthenticated, redirectToLogin } from '@/utils/auth'

/**
 * 配置路由守卫，自动拦截未登录访问
 * @param router - Vue Router实例
 */
export function setupAuthGuard(router: ReturnType<typeof createRouter>) {
  router.beforeEach((to, from, next) => {
    // 定义不需要登录的公开路由（如果有）
    const publicRoutes = ['/public', '/about']

    // 如果是公开路由，直接放行
    if (publicRoutes.includes(to.path)) {
      next()
      return
    }

    // 检查是否已登录
    if (!isAuthenticated()) {
      // 未登录，跳转到Portal登录页
      redirectToLogin(window.location.href)
      return
    }

    // 已登录，放行
    next()
  })
}
