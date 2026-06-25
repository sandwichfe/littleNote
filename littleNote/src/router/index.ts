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
  '/qrcode': () => import('../views/apps/qrcode/qrcodeView.vue'),
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
      handleUnauthenticatedUser(to, next, menuStore, '/manage/login')
    } else {
      await handleMenuAndRoutes(to, next, menuStore)
    }
    return
  }

  next()
})

export default router
