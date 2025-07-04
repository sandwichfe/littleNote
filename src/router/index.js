import { createRouter, createWebHistory } from 'vue-router'
import ManageLayout from '../ManageLayout.vue'
import Cookies from 'js-cookie'

// 基础路由
const constantRoutes = [
  {
    path: '/',
    component: () => import('../views/note.vue'),
    // component: () => import('../views/home.vue'),
  },
  {
    path: '/login',
    component: () => import('../login.vue'),
  },
  {
    path: '/note',
    component: () => import('../views/note.vue'),
  },
  {
    path: '/noteDetail/:id',
    component: () => import('../views/noteDetail.vue'),
  },
  {
    path: '/',
    name: 'ManageLayout', // 为主布局路由添加名称
    component: ManageLayout,
    children: [
      {
        path: '/qrcode',
        component: () => import('../views/qrcodeView.vue'),
      },
      {
        path: '/user',
        component: () => import('../views/user.vue'),
      },
      {
        path: '/role',
        component: () => import('../views/role.vue'),
      },
      {
        path: '/menu',
        component: () => import('../views/menu.vue'),
      },
      {
        path: '/noteGroup',
        component: () => import('../views/noteGroup.vue'),
      },
    ],
  },
]


// 动态路由映射表
const componentMap = {
  '/': () => import('../views/home.vue'),
  '/user': () => import('../views/user.vue'),
  '/role': () => import('../views/role.vue'),
  '/menu': () => import('../views/menu.vue'),
  '/qrcode': () => import('../views/qrcodeView.vue'),
  '/noteGroup': () => import('../views/noteGroup.vue')
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

  // 访问前 检查此路由菜单用户是否有权限访问
  if (to.path === '/login') {
    next()
  }
   // 没有token
  if (!token) {
    handleUnauthenticatedUser(to, next, menuStore)
   // 有token
  } else {
    await handleMenuAndRoutes(to, next, menuStore)
  }
})

export default router


// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes
// })
