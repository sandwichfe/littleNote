import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentUserMenus, type Menu } from '@/network/manage/menu'

export const useMenuStore = defineStore('menu', () => {
  const menuData = ref<Menu[]>([])
  const areRoutesAdded = ref(false)

  const fetchAndSetMenus = async () => {
    try {
      const response = await getCurrentUserMenus()
      if (response.code === 200) {
        menuData.value = response.data
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
