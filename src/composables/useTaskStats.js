import { computed } from 'vue'

/**
 * 任务统计组合式函数
 * @param {Array|Ref} tasks 任务列表
 * @returns {Object} 包含各种任务统计的计算属性
 */
export function useTaskStats(tasks) {
  // 安全获取任务列表的辅助函数
  const getTaskList = (tasks) => {
    // 如果tasks是函数，调用它获取值
    if (typeof tasks === 'function') {
      const result = tasks()
      return Array.isArray(result) ? result : []
    }
    // 如果tasks是数组，直接返回
    if (Array.isArray(tasks)) {
      return tasks
    }
    // 如果tasks是ref，获取其value
    if (tasks && tasks.value) {
      return Array.isArray(tasks.value) ? tasks.value : []
    }
    return []
  }

  // 工作任务统计
  const workTasks = computed(() => {
    const taskList = getTaskList(tasks)
    const work = taskList.filter(task => task && task.type === 'work')
    const completed = work.filter(task => task.completedCount >= task.targetCount).length
    return {
      total: work.length,
      completed,
      percentage: work.length > 0 ? Math.round((completed / work.length) * 100) : 0
    }
  })

  // 学习任务统计
  const studyTasks = computed(() => {
    const taskList = getTaskList(tasks)
    const study = taskList.filter(task => task && task.type === 'study')
    const completed = study.filter(task => task.completedCount >= task.targetCount).length
    return {
      total: study.length,
      completed,
      percentage: study.length > 0 ? Math.round((completed / study.length) * 100) : 0
    }
  })

  // 健康任务统计
  const healthTasks = computed(() => {
    const taskList = getTaskList(tasks)
    const health = taskList.filter(task => task && task.type === 'health')
    const completed = health.filter(task => task.completedCount >= task.targetCount).length
    return {
      total: health.length,
      completed,
      percentage: health.length > 0 ? Math.round((completed / health.length) * 100) : 0
    }
  })

  // 总进度统计
  const totalProgress = computed(() => {
    const taskList = getTaskList(tasks)
    const total = taskList.length
    const completed = taskList.filter(task => task && task.completedCount >= task.targetCount).length
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  // 任务筛选相关计算属性
  const allTasksCount = computed(() => {
    const taskList = getTaskList(tasks)
    return taskList.length
  })

  const pendingTasks = computed(() => {
    const taskList = getTaskList(tasks)
    return taskList.filter(task => task && task.completedCount < task.targetCount)
  })

  const completedTasks = computed(() => {
    const taskList = getTaskList(tasks)
    return taskList.filter(task => task && task.completedCount >= task.targetCount)
  })

  return {
    workTasks,
    studyTasks,
    healthTasks,
    totalProgress,
    allTasksCount,
    pendingTasks,
    completedTasks
  }
}