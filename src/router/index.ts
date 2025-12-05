import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import ManageLayout from '../views/manage/ManageLayout.vue'
import AppLayout from '../views/apps/AppLayout.vue'
import Cookies from 'js-cookie'

// 基础路由
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('../views/login/login.vue'),
    name: 'Login',
  },
  {
    path: '/todo',
    component: () => import('../views/apps/todo/todo.vue'),
    name: 'Todo',
  },

  // 前端应用布局 - 包含 note 相关页面
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
      },
    ],
  },
  // 管理端布局
  {
    path: '/manage',
    component: ManageLayout,
    name: 'ManageLayout',
    children: [
      {
        path: 'qrcode',
        component: () => import('../views/apps/qrcode/qrcodeView.vue'),
        name: 'QRCode',
      },
      {
        path: 'user',
        component: () => import('../views/manage/user.vue'),
        name: 'User',
      },
      {
        path: 'role',
        component: () => import('../views/manage/role.vue'),
        name: 'Role',
      },
      {
        path: 'menu',
        component: () => import('../views/manage/menu.vue'),
        name: 'Menu',
      },
      {
        path: 'dept',
        component: () => import('../views/manage/dept.vue'),
        name: 'Dept',
      },
      {
        path: 'noteGroup',
        component: () => import('../views/apps/note/noteGroup.vue'),
        name: 'NoteGroup',
      },
    ],
  },
]


// 动态路由映射表
const componentMap: Record<string, () => Promise<any>> = {
  '/user': () => import('../views/manage/user.vue'),
  '/role': () => import('../views/manage/role.vue'),
  '/menu': () => import('../views/manage/menu.vue'),
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
      path: menu.path.replace('/', ''), // 移除开头的斜杠
      name: menu.name,
      component: componentMap[menu.path],
      meta: {
        title: menu.title,
        icon: menu.icon,
        permission: menu.permission
      }
    }
  }

  // 修改路由生成逻辑
  menuData.forEach(menu => {
    if (menu.children && menu.children.length > 0) {
      menu.children.forEach(child => {
        routes.push(generateRoute(child))
      })
    } else if (menu.type === 1) { // 只添加类型为1的菜单
      routes.push(generateRoute(menu))
    }
  })

  return routes
}

import { useMenuStore } from '@/store/menu'

// 处理未登录用户的路由导航
function handleUnauthenticatedUser(to, next, menuStore) {
    menuStore.resetMenuState() // 清理状态
    next('/login')
}

// 处理菜单和路由加载
async function handleMenuAndRoutes(to, next, menuStore) {
    try {
      if (menuStore.areRoutesAdded) {
        next()
      } else {
        // 异步获取菜单和路由
        const { success } = await menuStore.fetchAndSetMenus()
        if (success) {
          // 使用 replace: true, 以免用户回退到之前的状态
          next({ ...to, replace: true })
        } else {
          console.error('获取用户菜单失败:')
          // 获取菜单失败，清除 token 并重定向到登录页
          menuStore.resetMenuState()
        }
      }
    } catch (error) {
      console.error('获取用户菜单失败:', error)
      menuStore.resetMenuState()
    }
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = Cookies.get('loginToken')
  const menuStore = useMenuStore()

  // 登录页面直接放行
  if (to.path === '/login') {
    next()
    return
  }

  // 前端应用路由（note 相关）不需要权限验证
  const publicRoutes = ['/note', '/noteDetail', '/todo', '/converter']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route)) || to.path === '/'

  if (isPublicRoute) {
    next()
    return
  }

  // 管理端路由需要权限验证
  if (to.path.startsWith('/manage')) {
    if (!token) {
      handleUnauthenticatedUser(to, next, menuStore)
    } else {
      await handleMenuAndRoutes(to, next, menuStore)
    }
    return
  }

  // 其他情况
  next()
})

export default router


// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes
// })
