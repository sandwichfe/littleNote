import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Cookies from 'js-cookie'
import { useMenuStore } from '@/store/menu'
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

function handleUnauthenticatedUser(to, next, menuStore, redirectPath = '/login') {
  menuStore.resetMenuState()
  next(redirectPath)
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

// 使用iframe加载Portal登录页的标记
let loginIframeCreated = false

function createLoginIframe() {
  if (loginIframeCreated) return
  loginIframeCreated = true

  const iframe = document.createElement('iframe')
  iframe.id = 'portal-login-iframe'
  iframe.src = 'http://localhost:9000/login?mode=iframe'
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:#fff;'
  document.body.appendChild(iframe)

  // 监听Portal回传的token
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== 'http://localhost:9000') return

    if (event.data.type === 'LOGIN_SUCCESS') {
      const token = event.data.token
      Cookies.set('loginToken', token, { expires: 7 })

      // 移除iframe和监听器
      const iframeEl = document.getElementById('portal-login-iframe')
      if (iframeEl) {
        document.body.removeChild(iframeEl)
      }
      window.removeEventListener('message', handleMessage)
      loginIframeCreated = false

      // 刷新页面以重新进入路由守卫
      window.location.reload()
    }
  }

  window.addEventListener('message', handleMessage)
}

router.beforeEach(async (to, from, next) => {
  const token = Cookies.get('loginToken')
  const menuStore = useMenuStore()

  // 排除登录页面
  if (to.path === '/login' || to.path === '/manage/login') {
    next()
    return
  }

  const publicRoutes = ['/note', '/noteDetail', '/todo', '/converter']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route)) || to.path === '/'

  if (isPublicRoute) {
    next()
    return
  }

  if (to.path.startsWith('/manage')) {
    if (!token) {
      // 创建iframe加载Portal登录页
      createLoginIframe()
      return
    } else {
      await handleMenuAndRoutes(to, next, menuStore)
    }
    return
  }

  next()
})

export default router
