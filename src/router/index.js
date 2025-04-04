import { createRouter, createWebHistory } from 'vue-router'
import ManageLayout from '../ManageLayout.vue'
import { getCurrentUserMenus } from '@/network/menu'
import Cookies from 'js-cookie'

// 基础路由
const constantRoutes = [
  {
    path: '/login',
    component: () => import('../login.vue')
  },
  {
    path: '/',
    component: ManageLayout,
    children: [] // 动态添加的子路由
  }
]

// 动态路由映射表
const componentMap = {
  '/user': () => import('../views/user.vue'),
  '/role': () => import('../views/role.vue'),
  '/menu': () => import('../views/menu.vue'),
  '/note': () => import('../views/note.vue'),
  '/noteDetail/:id': () => import('../views/noteDetail.vue'),
  '/qrcode': () => import('../views/qrcodeView.vue')
}

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
  const token = Cookies.get('loginToken')
  
  if (!token && to.path !== '/login') {
    next('/login')
    return
  }
  
  if (token && to.path === '/login') {
    next('/')
    return
  }

  if (token && router.getRoutes().length === 2) {
    try {
      const response = await getCurrentUserMenus()
      if (response.code === 200) {
        const routes = generateRoutes(response.data)
        routes.forEach(route => {
          router.addRoute(route)
        })
        next({ ...to, replace: true })
      } else {
        Cookies.remove('loginToken')
        next('/login')
      }
    } catch (error) {
      console.error('加载动态路由失败:', error)
      Cookies.remove('loginToken')
      next('/login')
    }
  } else {
    next()
  }
})

export function generateRoutes(menuData) {
  const routes = []
  
  function generateRoute(menu) {
    const route = {
      path: menu.path,
      name: menu.name,
      component: componentMap[menu.path],
      meta: {
        title: menu.title,
        icon: menu.icon,
        permission: menu.permission
      }
    }

    if (menu.children && menu.children.length > 0) {
      route.children = menu.children.map(child => generateRoute(child))
    }

    return route
  }

  // 将生成的路由添加到根路由的 children 中
  menuData.forEach(menu => {
    if (menu.children && menu.children.length > 0) {
      menu.children.forEach(child => {
        routes.push(generateRoute(child))
      })
    } else {
      routes.push(generateRoute(menu))
    }
  })

  return routes
}

export default router


// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes
// })
