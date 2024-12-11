import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import note from '../views/note.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      // name: 'note',        //name属性会找不到组件
      component: note
    },
    {
      path: '/note',
      component: () => import('../views/note.vue')
    } ,
      {
      path: '/noteDetail/:id',
      component: () => import('../views/noteDetail.vue')
    },
    {
      path: '/login',
      component: () => import('../login.vue')
    } ,
    {
      path: '/qrcode',
      component: () => import('../views/qrcodeView.vue')
    } ,
  ]
})

export default router
