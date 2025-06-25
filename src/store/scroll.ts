import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义一个 store 来管理滚动位置
export const useScrollStore = defineStore('scroll', () => {
  // 滚动位置状态
  const scrollPosition = ref(0)

  // 更新滚动位置的方法
  function updateScrollPosition(position: number) {
    scrollPosition.value = position
  }

  // 重置滚动位置的方法
  function resetScrollPosition() {
    scrollPosition.value = 0
  }

  // 返回状态和方法
  return { 
    scrollPosition, 
    updateScrollPosition,
    resetScrollPosition
  }
})