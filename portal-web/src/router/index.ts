import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Cookies from 'js-cookie'
import { useMenuStore } from '@/store/menu'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    name: 'Login'
  },
  {
    path: '/logout',
    component: () => import('@/views/logout.vue'),
    name: 'Logout'
  },
  {
    path: '/',
    component: () => import('@/views/layout/ManageLayout.vue'),
    name: 'ManageLayout',
    redirect: '/user',
    children: [
      {
        path: 'user',
        component: () => import('@/views/manage/user.vue'),
        name: 'User'
      },
      {
        path: 'role',
        component: () => import('@/views/manage/role.vue'),
        name: 'Role'
      },
      {
        path: 'menu',
        component: () => import('@/views/manage/menu.vue'),
        name: 'Menu'
      },
      {
        path: 'dept',
        component: () => import('@/views/manage/dept.vue'),
        name: 'Dept'
      },
      {
        path: 'dict',
        component: () => import('@/views/manage/dict.vue'),
        name: 'Dict'
      },
      {
        path: 'operationLog',
        component: () => import('@/views/manage/operationLog.vue'),
        name: 'OperationLog'
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = Cookies.get('loginToken')
  const menuStore = useMenuStore()

  // 登录页和登出页直接放行
  if (to.path === '/login' || to.path === '/logout') {
    next()
    return
  }

  // 未登录跳转登录页，保留原始URL参数
  if (!token) {
    menuStore.resetMenuState()
    // 如果当前路由有参数，保留这些参数传递给登录页
    if (Object.keys(to.query).length > 0) {
      next({ path: '/login', query: to.query })
    } else {
      next('/login')
    }
    return
  }

  // 已登录，加载菜单
  try {
    if (menuStore.areRoutesAdded) {
      next()
    } else {
      const { success } = await menuStore.fetchAndSetMenus()
      if (success) {
        next({ ...to, replace: true })
      } else {
        console.error('获取用户菜单失败')
        menuStore.resetMenuState()
        next('/login')
      }
    }
  } catch (error) {
    console.error('获取用户菜单失败:', error)
    menuStore.resetMenuState()
    next('/login')
  }
})

export default router
