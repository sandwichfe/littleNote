import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getTasks,
  getDailyTasks,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  copyToDaily,
  getUserPoints,
  getDayView,
  getWeekView,
  getMonthView,
} from '@/network/todo'
import { useTaskStats } from './useTaskStats'
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

  // 响应式状态
  const userInfo = ref({
    nickname: 'Sarah Wilson',
    role: '设计师',
    avatar: 'https://49.235.149.110/favicon.ico'
  })

  const userPoints = ref(0)
  const activeNav = ref('daily')
  const allTasks = ref([])
  const dailyTasks = ref([])
  const taskFilter = ref('pending')
  const rewardsList = ref([])
  const myRewards = ref([])
  const activeView = ref('day')
  const showAddTaskDialog = ref(false)
  const showEditTaskDialog = ref(false)
  const showAddRewardDialog = ref(false)
  const editingTask = ref(null)
  const editTaskReadOnly = ref(false)

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

  // 使用任务统计和工具函数
  const { 
    workTasks, 
    studyTasks, 
    healthTasks, 
    totalProgress,
    allTasksCount,
    pendingTasks,
    completedTasks
  } = useTaskStats(allTasks)
  
  const { getTaskTypeColor, getTaskTypeLabel, formatDate } = useTaskUtils()

  // 筛选后的任务列表
  const filteredTasks = computed(() => {
    switch (taskFilter.value) {
      case 'pending':
        return pendingTasks.value
      case 'completed':
        return completedTasks.value
      default:
        return pendingTasks.value // 默认显示待完成任务
    }
  })

  // 方法
  const setActiveNav = async (nav) => {
    activeNav.value = nav
    
    // 根据导航切换加载对应数据
    switch (nav) {
      case 'myRewards':
        await loadMyRewards()
        break
      case 'rewards':
        await loadRewards()
        break
      case 'todoList':
        // 每次切换到待办列表都重新加载，确保数据最新
        await loadAllTasks()
        break
      case 'daily':
        await loadDailyTasks()
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

  const setTaskFilter = (filter) => {
    taskFilter.value = filter
  }

  const incrementTaskCount = async (task) => {
    if (task.completedCount < task.targetCount) {
      try {
        const result = await completeTask(task.id)
        task.completedCount++
        
        if (task.completedCount >= task.targetCount) {
          task.completed = true
          userPoints.value += task.points
          ElMessage.success(`任务已全部完成！获得 ${task.points} 积分！${task.encouragement}`)
        } else {
          ElMessage.success(`进度 +1！还需完成 ${task.targetCount - task.completedCount} 次`)
        }
        
        // 刷新用户积分和任务列表
        await loadUserPoints()
        await loadAllTasks() // 刷新任务列表以更新计数
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
      await loadAllTasks()
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
      await loadAllTasks()
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
      await loadAllTasks()
    } catch (error) {
      ElMessage.error('删除任务失败')
    }
  }

  const handleCopyToDaily = async (task) => {
    // 检查是否已经存在相同的任务
    const tasks = Array.isArray(dailyTasks.value) ? dailyTasks.value : []
    const exists = tasks.some(dailyTask => dailyTask.originalTaskId === task.id)
    if (exists) {
      ElMessage.warning('该任务已存在于每日待办中！')
      return
    }
    
    try {
      const result = await copyToDaily(task.id)
      // 重新加载每日任务列表
      await loadDailyTasks()
      ElMessage.success('任务已复制到每日待办！')
    } catch (error) {
      ElMessage.error('复制任务失败')
    }
  }


  // 数据加载方法
  const loadAllTasks = async () => {
    try {
      const result = await getTasks()
      // 处理API响应格式 {code, msg, data, time}
      if (result && result.data) {
        allTasks.value = Array.isArray(result.data) ? result.data : result.data.records || []
      } else {
        allTasks.value = result.records || result || []
      }
    } catch (error) {
      console.error('加载任务列表失败:', error)
      allTasks.value = []
    }
  }

  const loadDailyTasks = async () => {
    try {
      const result = await getDailyTasks()
      // 处理API响应格式 {code, msg, data, time}
      if (result && result.data) {
        dailyTasks.value = Array.isArray(result.data) ? result.data : result.data.records || []
      } else {
        dailyTasks.value = result.records || result || []
      }
    } catch (error) {
      console.error('加载每日任务失败:', error)
      dailyTasks.value = []
    }
  }

  const loadUserPoints = async () => {
    try {
      const result = await getUserPoints()
      // 处理API响应格式
      if (result && result.data) {
        userPoints.value = result.data.totalPoints || 0
      } else {
        userPoints.value =  0
      }
    } catch (error) {
      console.error('加载用户积分失败:', error)
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
      loadAllTasks(),
      loadDailyTasks(),
      loadUserPoints(),
    ])
  }

  return {
    // 状态
    userInfo,
    userPoints,
    activeNav,
    allTasks,
    dailyTasks,
    taskFilter,
    rewardsList,
    myRewards,
    activeView,
    showAddTaskDialog,
    showEditTaskDialog,
    showAddRewardDialog,
    editingTask,
    editTaskReadOnly,
    daySchedule,
    weekDays,
    monthDates,
    viewSelectedDate,
    viewSelectedYear,
    viewSelectedWeek,
    viewSelectedMonth,
    viewSummary,
    viewLoading,
    
    // 计算属性
    workTasks,
    studyTasks,
    healthTasks,
    totalProgress,
    allTasksCount,
    pendingTasks,
    completedTasks,
    filteredTasks,
    
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
    handleCopyToDaily,
    loadAllTasks,
    loadDailyTasks,
    loadUserPoints,
    loadViewData,
    initData,
  }
}
