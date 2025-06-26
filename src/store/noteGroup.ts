import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义一个 store 来管理笔记分组选择
export const useNoteGroupStore = defineStore('noteGroup', () => {
  // 当前选中的分组ID
  const selectedGroupId = ref('')

  // 更新选中的分组ID
  function updateSelectedGroupId(groupId: string) {
    selectedGroupId.value = groupId
  }

  // 重置选中的分组ID
  function resetSelectedGroupId() {
    selectedGroupId.value = ''
  }

  // 返回状态和方法
  return { 
    selectedGroupId, 
    updateSelectedGroupId,
    resetSelectedGroupId
  }
})