import { createRouter, createWebHistory } from 'vue-router'
import ManageLayout from '../ManageLayout.vue'
import Cookies from 'js-cookie'

// 基础路由
const constantRoutes = [
  {
    path: '/login',
    component: () => import('../login.vue')
  },
  {
    path: '/note',
    component: () => import('../views/note.vue')
  },
  {
    path: '/noteDetail/:id',
    component: () => import('../views/noteDetail.vue')
  },
  {
    path: '/',
    name: 'ManageLayout', // 为主布局路由添加名称
    component: ManageLayout,
    children: [
      {
        path: '/qrcode',
        component: () => import('../views/qrcodeView.vue')
      },
      {
        path: '/user',
        component: () => import('../views/user.vue')
      },
      {
        path: '/role',
        component: () => import('../views/role.vue')
      },
      {
        path: '/menu',
        component: () => import('../views/menu.vue')
      }
    ]
  }
]


// 动态路由映射表
const componentMap = {
  '/user': () => import('../views/user.vue'),
  '/role': () => import('../views/role.vue'),
  '/menu': () => import('../views/menu.vue'),
  '/qrcode': () => import('../views/qrcodeView.vue')
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

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = Cookies.get('loginToken')

  if (!token && to.path !== '/login') {
    // 如果没有token且目标不是登录页，重定向到登录页
    next('/login')
  } else if (token && to.path === '/login') {
    // 如果有token且要去登录页，重定向到首页
    next('/')
  } else {
    // 其他情况正常放行
    next()
  }
})

export default router


// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes
// })
