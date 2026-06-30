import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Cookies from 'js-cookie'
import { useMenuStore } from '@/store/menu'
import { redirectToLogin, isAuthenticated, waitForAuthInit, isAuthCallback } from '@/utils/auth'
import AppLayout from '../views/apps/AppLayout.vue'

const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    name: 'AppLayout',
    children: [
      {
        path: '',
        redirect: '/note'
      },
      {
        path: 'note',
        component: () => import('../views/apps/note/note.vue'),
        name: 'Note',
      },
      {
        path: 'noteDetail/:id',
        component: () => import('../views/apps/note/noteDetail.vue'),
        name: 'NoteDetail',
        props: route => ({
          initialViewMode: route.query.viewMode === 'edit' ? 'edit' : 'preview'
        }),
      },
      {
        path: 'todo/:section?',
        component: () => import('../views/apps/todo/todo.vue'),
        name: 'Todo',
      },
    ],
  },
]

const componentMap: Record<string, () => Promise<any>> = {
  '/noteGroup': () => import('../views/apps/note/noteGroup.vue'),
  '/todo': () => import('../views/apps/todo/todo.vue'),
  '/note': () => import('../views/apps/note/note.vue'),
  '/noteDetail': () => import('../views/apps/note/noteDetail.vue')
}

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

export function generateRoutes(menuData) {
  const routes = []

  function generateRoute(menu) {
    return {
      path: menu.path.replace('/', ''),
      name: menu.name,
      component: componentMap[menu.path],
      meta: {
        title: menu.title,
        icon: menu.icon,
        permission: menu.permission
      }
    }
  }

  menuData.forEach(menu => {
    if (menu.children && menu.children.length > 0) {
      menu.children.forEach(child => {
        routes.push(generateRoute(child))
      })
    } else if (menu.type === 1) {
      routes.push(generateRoute(menu))
    }
  })

  return routes
}

function handleUnauthenticatedUser() {
  // 跳转到Portal统一登录（携带当前URL作为回跳地址）
  redirectToLogin(window.location.href)
}

async function handleMenuAndRoutes(to, next, menuStore) {
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
      }
    }
  } catch (error) {
    console.error('获取用户菜单失败:', error)
    menuStore.resetMenuState()
  }
}

router.beforeEach(async (to, from, next) => {
  const menuStore = useMenuStore()

  // 排除登录页面（虽然子应用不需要登录页）
  if (to.path === '/login' || to.path === '/manage/login') {
    next()
    return
  }

  // 【认证流程优先】如果是OAuth回调，必须等待认证初始化完成
  if (isAuthCallback()) {
    console.log('===== [路由守卫] 检测到OAuth回调，等待认证初始化完成 =====')
    await waitForAuthInit()
    console.log('===== [路由守卫] 认证初始化完成，继续路由处理 =====')
  }

  // 定义不需要登录的公开路由（如果需要所有页面都登录，将此数组清空）
  const publicRoutes: string[] = []  // 所有路由都需要登录
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route)) || to.path === '/'

  if (isPublicRoute) {
    next()
    return
  }

  // 所有非公开路由都需要登录
  if (!isAuthenticated()) {
    console.log('未登录，跳转到Portal登录');
    handleUnauthenticatedUser()
    return
  }

  // 已登录的路由处理
  if (to.path.startsWith('/manage')) {
    // 管理后台需要加载菜单
    await handleMenuAndRoutes(to, next, menuStore)
    return
  }

  // 其他已登录路由正常放行
  next()
})

export default router
