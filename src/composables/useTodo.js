import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getTasks,
  getTaskCounts,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  getDayView,
  getWeekView,
  getMonthView,
  getTaskCompletionRecords,
  updateTaskCompletionRecord,
} from '@/network/todo'
import { useTaskUtils } from './useTaskUtils'

export function useTodo() {
  function getISOWeek(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  }

  const activeNav = ref('todoList')
  const allTasks = ref([])
  const taskFilter = ref('pending')
  const rewardsList = ref([])
  const activeView = ref('day')
  const showAddTaskDialog = ref(false)
  const showEditTaskDialog = ref(false)
  const showViewTaskDialog = ref(false)
  const showAddRewardDialog = ref(false)
  const editingTask = ref(null)
  const viewingTask = ref(null)
  const editTaskReadOnly = ref(false)
  const pendingCount = ref(0)
  const completedCount = ref(0)
  const selectedTaskHistory = ref([])
  const taskHistoryLoading = ref(false)

  const daySchedule = ref([])
  const weekDays = ref([])
  const monthDates = ref([])

  const viewSelectedDate = ref(new Date().toISOString().split('T')[0])
  const viewSelectedYear = ref(new Date().getFullYear())
  const viewSelectedWeek = ref(getISOWeek(new Date()))
  const viewSelectedMonth = ref(new Date().getMonth() + 1)

  const viewSummary = ref({
    weekLabel: '',
    dateRange: '',
    monthLabel: '',
    taskTotal: 0,
    completedTotal: 0,
  })

  const viewLoading = ref(false)

  const { getTaskTypeColor, getTaskTypeLabel, formatDate } = useTaskUtils()

  const normalizeTask = (task) => task
    ? {
        ...task,
        deadline: task.deadline || '',
        type: task.taskType || task.type,
      }
    : null

  const loadTaskCounts = async () => {
    try {
      const result = await getTaskCounts()
      const data = result?.data || result || {}
      pendingCount.value = Number(data.pendingCount || 0)
      completedCount.value = Number(data.completedCount || 0)
    } catch (error) {
      console.error('Failed to load task counts:', error)
      pendingCount.value = 0
      completedCount.value = 0
    }
  }

  const loadTaskHistory = async (task) => {
    if (!task?.id || Number(task.targetCount || 0) <= 1) {
      selectedTaskHistory.value = []
      taskHistoryLoading.value = false
      return
    }

    taskHistoryLoading.value = true
    try {
      const result = await getTaskCompletionRecords(task.id)
      const data = result?.data || result || []
      selectedTaskHistory.value = Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to load task history:', error)
      selectedTaskHistory.value = []
      ElMessage.error('加载任务完成记录失败')
    } finally {
      taskHistoryLoading.value = false
    }
  }

  const loadAllTasks = async (status) => {
    try {
      const params = {}
      if (status !== undefined) {
        params.status = status
      }
      const result = await getTasks(params)
      if (result && result.data) {
        allTasks.value = Array.isArray(result.data) ? result.data : result.data.records || []
      } else {
        allTasks.value = result.records || result || []
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      allTasks.value = []
    }
  }

  const refreshListAndCounts = async () => {
    const status = taskFilter.value === 'completed' ? 1 : 0
    await Promise.all([
      loadTaskCounts(),
      loadAllTasks(status),
    ])
  }

  const setActiveNav = async (nav) => {
    activeNav.value = nav

    switch (nav) {
      case 'todoList':
        await refreshListAndCounts()
        break
      case 'taskViews':
        await loadViewData()
        break
    }
  }

  const setActiveView = async (view) => {
    activeView.value = view
    await loadViewData()
  }

  const setTaskFilter = async (filter) => {
    taskFilter.value = filter
    const status = filter === 'completed' ? 1 : 0
    await loadAllTasks(status)
  }

  const incrementTaskCount = async (task) => {
    if (task.completedCount >= task.targetCount) {
      return
    }

    try {
      await completeTask(task.id)
      const nextCompletedCount = Number(task.completedCount || 0) + 1

      if (nextCompletedCount >= task.targetCount) {
        ElMessage.success('任务已完成')
      } else {
        ElMessage.success(`已完成 1 次，还差 ${task.targetCount - nextCompletedCount} 次`)
      }

      await refreshListAndCounts()
      if (showViewTaskDialog.value && viewingTask.value?.id === task.id) {
        const latestTask = allTasks.value.find(item => item.id === task.id)
        viewingTask.value = normalizeTask(latestTask || { ...task, completedCount: nextCompletedCount })
        await loadTaskHistory(viewingTask.value)
      }
    } catch (error) {
      const msg = error.response?.data?.msg || '完成任务失败'
      ElMessage.error(msg)
    }
  }

  const handleAddTask = async (taskData) => {
    if (!taskData.content || !taskData.type) {
      ElMessage.warning('请完善任务内容')
      return
    }

    const task = {
      content: taskData.content,
      taskType: taskData.type,
      category: 'global',
      points: taskData.points,
      encouragement: taskData.encouragement || 'Keep going',
      deadline: taskData.deadline || undefined,
      targetCount: taskData.targetCount || 1,
      isDailyLimit: taskData.isDailyLimit || 0,
    }

    try {
      await addTask(task)
      showAddTaskDialog.value = false
      ElMessage.success('任务已添加')
      await refreshListAndCounts()
    } catch (error) {
      console.error('Failed to add task:', error)
      ElMessage.error('添加任务失败')
    }
  }

  const handleEditTask = (task) => {
    editingTask.value = normalizeTask(task)
    editTaskReadOnly.value = false
    showEditTaskDialog.value = true
  }

  const handleViewTask = async (task) => {
    viewingTask.value = normalizeTask(task)
    showViewTaskDialog.value = true
    await loadTaskHistory(viewingTask.value)
  }

  const handleUpdateTask = async (taskData) => {
    if (!taskData.content || !taskData.type) {
      ElMessage.warning('请完善任务内容')
      return
    }

    const task = {
      content: taskData.content,
      taskType: taskData.type,
      points: taskData.points,
      encouragement: taskData.encouragement,
      deadline: taskData.deadline || undefined,
      targetCount: taskData.targetCount,
      isDailyLimit: taskData.isDailyLimit,
    }

    try {
      await updateTask(taskData.id, task)
      showEditTaskDialog.value = false
      editTaskReadOnly.value = false
      ElMessage.success('任务已更新')
      await refreshListAndCounts()
      if (showViewTaskDialog.value && viewingTask.value?.id === taskData.id) {
        const latestTask = allTasks.value.find(item => item.id === taskData.id)
        viewingTask.value = normalizeTask(latestTask || { ...viewingTask.value, ...taskData })
        await loadTaskHistory(viewingTask.value)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      ElMessage.error('更新任务失败')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      if (viewingTask.value?.id === taskId) {
        showViewTaskDialog.value = false
        viewingTask.value = null
        selectedTaskHistory.value = []
      }
      ElMessage.success('任务已删除')
      await refreshListAndCounts()
    } catch (error) {
      ElMessage.error('删除任务失败')
    }
  }

  const handleUpdateCompletionRecord = async ({ taskId, recordId, completedAt }) => {
    if (!taskId || !recordId || !completedAt) {
      ElMessage.warning('请先选择有效的完成时间')
      return
    }

    try {
      await updateTaskCompletionRecord(taskId, recordId, completedAt)
      ElMessage.success('完成记录已更新')
      await refreshListAndCounts()
      if (showViewTaskDialog.value && viewingTask.value?.id === taskId) {
        const latestTask = allTasks.value.find(item => item.id === taskId)
        viewingTask.value = normalizeTask(latestTask || viewingTask.value)
        await loadTaskHistory(viewingTask.value)
      }
    } catch (error) {
      const msg = error.response?.data?.msg || '更新完成记录失败'
      ElMessage.error(msg)
    }
  }

  const handleAddReward = () => {
    showAddRewardDialog.value = false
  }

  const loadDayView = async () => {
    viewLoading.value = true
    try {
      const result = await getDayView(viewSelectedDate.value)
      if (result && result.data) {
        const data = result.data
        daySchedule.value = data.schedule || []
        viewSummary.value = {
          ...viewSummary.value,
          taskTotal: data.taskTotal || 0,
          completedTotal: data.completedTotal || 0,
        }
      }
    } catch (error) {
      console.error('Failed to load day view:', error)
      daySchedule.value = []
    } finally {
      viewLoading.value = false
    }
  }

  const loadWeekView = async () => {
    viewLoading.value = true
    try {
      const result = await getWeekView(viewSelectedYear.value, viewSelectedWeek.value)
      if (result && result.data) {
        const data = result.data
        weekDays.value = data.days || []
        viewSummary.value = {
          ...viewSummary.value,
          weekLabel: data.weekLabel || '',
          dateRange: data.dateRange || '',
          taskTotal: data.taskTotal || 0,
          completedTotal: data.completedTotal || 0,
        }
      }
    } catch (error) {
      console.error('Failed to load week view:', error)
      weekDays.value = []
    } finally {
      viewLoading.value = false
    }
  }

  const loadMonthView = async () => {
    viewLoading.value = true
    try {
      const result = await getMonthView(viewSelectedYear.value, viewSelectedMonth.value)
      if (result && result.data) {
        const data = result.data
        monthDates.value = data.dates || []
        viewSummary.value = {
          ...viewSummary.value,
          monthLabel: data.monthLabel || '',
          taskTotal: data.taskTotal || 0,
          completedTotal: data.completedTotal || 0,
        }
      }
    } catch (error) {
      console.error('Failed to load month view:', error)
      monthDates.value = []
    } finally {
      viewLoading.value = false
    }
  }

  const loadViewData = async () => {
    switch (activeView.value) {
      case 'day':
        await loadDayView()
        break
      case 'week':
        await loadWeekView()
        break
      case 'month':
        await loadMonthView()
        break
    }
  }

  const initData = async () => {
    await Promise.all([
      loadTaskCounts(),
      loadAllTasks(0),
    ])
  }

  return {
    activeNav,
    allTasks,
    taskFilter,
    rewardsList,
    activeView,
    showAddTaskDialog,
    showEditTaskDialog,
    showViewTaskDialog,
    showAddRewardDialog,
    editingTask,
    viewingTask,
    editTaskReadOnly,
    pendingCount,
    completedCount,
    selectedTaskHistory,
    taskHistoryLoading,
    daySchedule,
    weekDays,
    monthDates,
    viewSelectedDate,
    viewSelectedYear,
    viewSelectedWeek,
    viewSelectedMonth,
    viewSummary,
    viewLoading,

    getTaskTypeColor,
    getTaskTypeLabel,
    formatDate,

    setActiveNav,
    setActiveView,
    setTaskFilter,
    incrementTaskCount,
    handleAddTask,
    handleEditTask,
    handleViewTask,
    handleUpdateTask,
    handleUpdateCompletionRecord,
    handleDeleteTask,
    handleAddReward,
    loadTaskCounts,
    loadAllTasks,
    loadViewData,
    initData,
  }
}
