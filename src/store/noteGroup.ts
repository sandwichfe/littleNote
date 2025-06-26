import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNoteGroupStore = defineStore('noteGroup', () => {
  // 明确声明为 number 类型（使用 TypeScript 泛型）
  const selectedGroupId = ref<number>(0)

  // 只接受 number 类型的参数
  function updateSelectedGroupId(groupId: number) {
    selectedGroupId.value = groupId
  }

  function resetSelectedGroupId() {
    selectedGroupId.value = -1
  }

  return { 
    selectedGroupId, 
    updateSelectedGroupId,
    resetSelectedGroupId
  }
})
