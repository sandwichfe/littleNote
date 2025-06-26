import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentUserMenus } from '@/network/menu'
import { generateRoutes } from '@/router'
import router from '@/router'

export const useMenuStore = defineStore('menu', () => {
  const menuData = ref([])
  const areRoutesAdded = ref(false)

  const fetchAndSetMenus = async () => {
    try {
      const response = await getCurrentUserMenus()
      if (response.code === 200) {
        menuData.value = response.data
        const dynamicRoutes = generateRoutes(response.data)
        dynamicRoutes.forEach(route => {
          if (route.path && !router.hasRoute(route.name)) {
            router.addRoute('ManageLayout', route)
          }
        })
        areRoutesAdded.value = true
        return { success: true }
      } else {
        resetMenuState()
        return { success: false, message: response.msg }
      }
    } catch (error) {
      console.error('Failed to fetch menus and generate routes:', error)
      resetMenuState()
      return { success: false, error }
    }
  }

  const resetMenuState = () => {
    menuData.value = []
    areRoutesAdded.value = false
  }

  return { menuData, areRoutesAdded, fetchAndSetMenus, resetMenuState }
})