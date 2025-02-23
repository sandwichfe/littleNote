import { createRouter, createWebHistory } from 'vue-router'
import note from '../views/note.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: note
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
      path: '/login',
      component: () => import('../login.vue')
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
})

export default router