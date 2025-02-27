import { createRouter, createWebHistory } from 'vue-router'
import ManageLayout from '../ManageLayout.vue'

const routes = [
  {
    path: '/login',
    component: () => import('../login.vue')
  },
  {
    path: '/note',
    component: () => import('../views/note.vue')
  },
  {
    path: '/',
    component: ManageLayout,
    children: [
      {
        path: '/noteDetail/:id',
        component: () => import('../views/noteDetail.vue')
      },
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router