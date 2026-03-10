import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  getDayView,
  getWeekView,
  getMonthView,
} from '@/network/todo'
import { useTaskUtils } from './useTaskUtils'

export function useTodo() {
  // ISO 周数计算
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
  const editingTask = ref(null)
  const editTaskReadOnly = ref(false)
  const pendingCount = ref(0)
  const completedCount = ref(0)

  // 任务视图数据
  const daySchedule = ref([])
  const weekDays = ref([])
  const monthDates = ref([])

  // 视图选择器状态
  const viewSelectedDate = ref(new Date().toISOString().split('T')[0])
  const viewSelectedYear = ref(new Date().getFullYear())
  const viewSelectedWeek = ref(getISOWeek(new Date()))
  const viewSelectedMonth = ref(new Date().getMonth() + 1)

  // 视图汇总信息
  const viewSummary = ref({
    weekLabel: '',
    dateRange: '',
    monthLabel: '',
    taskTotal: 0,
    completedTotal: 0,
  })

  const viewLoading = ref(false)

  const { getTaskTypeColor, getTaskTypeLabel, formatDate } = useTaskUtils()

  // 方法
  const setActiveNav = async (nav) => {
    activeNav.value = nav
    
    // 根据导航切换加载对应数据
    switch (nav) {
      case 'todoList':
        // 每次切换到待办列表都重新加载，确保数据最新
        await loadAllTasks(taskFilter.value === 'completed' ? 1 : 0)
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
    if (task.completedCount < task.targetCount) {
      try {
        const result = await completeTask(task.id)
        task.completedCount++
        
        if (task.completedCount >= task.targetCount) {
          task.status = 1
          ElMessage.success("任务已全部完成！")
        } else {
          ElMessage.success(`进度 +1！还需完成 ${task.targetCount - task.completedCount} 次`)
        }

        // 刷新用户积分和任务列表
        await loadAllTasks(taskFilter.value === 'completed' ? 1 : 0)
      } catch (error) {
        // 优先使用后端返回的错误信息
        const msg = error.response?.data?.msg || '完成任务失败'
        ElMessage.error(msg)
      }
    }
  }

  const handleAddTask = async (taskData) => {
    if (!taskData.content || !taskData.type) {
      ElMessage.warning('请填写完整的任务信息')
      return
    }
    
    const task = {
      content: taskData.content,
      taskType: taskData.type,
      category: 'global',
      points: taskData.points,
      encouragement: taskData.encouragement || '任务完成，继续加油！',
      deadline: taskData.deadline || undefined,
      targetCount: taskData.targetCount || 1,
      isDailyLimit: taskData.isDailyLimit || 0
    }
    
    try {
      const result = await addTask(task)
      
      showAddTaskDialog.value = false
      ElMessage.success('任务添加成功！')

      // 刷新任务列表以更新计数
      await loadAllTasks(taskFilter.value === 'completed' ? 1 : 0)
    } catch (error) {
      console.error('添加任务失败:', error)
      ElMessage.error('添加任务失败')
    }
  }

  const handleEditTask = (task) => {
    editingTask.value = {
      ...task,
      deadline: task.deadline || '',
      type: task.taskType || task.type
    }
    editTaskReadOnly.value = false
    showEditTaskDialog.value = true
  }

  const handleViewTask = (task) => {
    editingTask.value = {
      ...task,
      deadline: task.deadline || '',
      type: task.taskType || task.type
    }
    editTaskReadOnly.value = true
    showEditTaskDialog.value = true
  }

  const handleUpdateTask = async (taskData) => {
    if (!taskData.content || !taskData.type) {
      ElMessage.warning('请填写完整的任务信息')
      return
    }

    const task = {
      content: taskData.content,
      taskType: taskData.type,
      points: taskData.points,
      encouragement: taskData.encouragement,
      deadline: taskData.deadline || undefined,
      targetCount: taskData.targetCount,
      isDailyLimit: taskData.isDailyLimit
    }

    try {
      await updateTask(taskData.id, task)
      showEditTaskDialog.value = false
      editTaskReadOnly.value = false
      ElMessage.success('任务更新成功！')
      await loadAllTasks(taskFilter.value === 'completed' ? 1 : 0)
    } catch (error) {
      console.error('更新任务失败:', error)
      ElMessage.error('更新任务失败')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      ElMessage.success('任务删除成功！')

      // 刷新任务列表以更新计数
      await loadAllTasks(taskFilter.value === 'completed' ? 1 : 0)
    } catch (error) {
      ElMessage.error('删除任务失败')
    }
  }

  // 数据加载方法
  const loadAllTasks = async (status) => {
    try {
      const params = {}
      if (status !== undefined) {
        params.status = status
      }
      const result = await getTasks(params)
      // 处理API响应格式 {code, msg, data, time}
      if (result && result.data) {
        allTasks.value = Array.isArray(result.data) ? result.data : result.data.records || []
      } else {
        allTasks.value = result.records || result || []
      }
      // 更新对应状态的计数
      if (status === 0) {
        pendingCount.value = allTasks.value.length
      } else if (status === 1) {
        completedCount.value = allTasks.value.length
      }
    } catch (error) {
      console.error('加载任务列表失败:', error)
      allTasks.value = []
    }
  }

  // 加载日视图数据
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
      console.error('加载日视图失败:', error)
      daySchedule.value = []
    } finally {
      viewLoading.value = false
    }
  }

  // 加载周视图数据
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
      console.error('加载周视图失败:', error)
      weekDays.value = []
    } finally {
      viewLoading.value = false
    }
  }

  // 加载月视图数据
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
      console.error('加载月视图失败:', error)
      monthDates.value = []
    } finally {
      viewLoading.value = false
    }
  }

  // 根据当前视图类型加载数据
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

  // 初始化所有数据
  const initData = async () => {
    await Promise.all([
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
    editingTask,
    editTaskReadOnly,
    pendingCount,
    completedCount,
    daySchedule,
    weekDays,
    monthDates,
    viewSelectedDate,
    viewSelectedYear,
    viewSelectedWeek,
    viewSelectedMonth,
    viewSummary,
    viewLoading,
    
    // 工具函数
    getTaskTypeColor,
    getTaskTypeLabel,
    formatDate,
    
    // 方法
    setActiveNav,
    setActiveView,
    setTaskFilter,
    incrementTaskCount,
    handleAddTask,
    handleEditTask,
    handleViewTask,
    handleUpdateTask,
    handleDeleteTask,
    loadAllTasks,
    loadViewData,
    initData,
  }
}
