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
} from '@/network/todo'
import { useTaskStats } from './useTaskStats'
import { useTaskUtils } from './useTaskUtils'

export function useTodo() {
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

  // 任务视图数据
  const daySchedule = ref([
    {
      time: '09:00',
      tasks: [{ id: 1, content: '产品设计', type: 'work' }]
    },
    {
      time: '10:00',
      tasks: [{ id: 2, content: '团队会议', type: 'work' }]
    },
    {
      time: '11:00',
      tasks: []
    }
  ])

  const weekDays = ref([
    { label: '周一 1/6', date: '2025-01-06', taskCount: 4 },
    { label: '周二 1/7', date: '2025-01-07', taskCount: 3 },
    { label: '周三 1/8', date: '2025-01-08', taskCount: 5 },
    { label: '周四 1/9', date: '2025-01-09', taskCount: 2 },
    { label: '周五 1/10', date: '2025-01-10', taskCount: 4 },
    { label: '周六 1/11', date: '2025-01-11', taskCount: 1 },
    { label: '周日 1/12', date: '2025-01-12', taskCount: 2 }
  ])

  const monthDates = ref([])

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
    }
  }

  const setActiveView = (view) => {
    activeView.value = view
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
      type: task.taskType || task.type
    }
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
      targetCount: taskData.targetCount,
      isDailyLimit: taskData.isDailyLimit
    }

    try {
      await updateTask(taskData.id, task)
      showEditTaskDialog.value = false
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


  // 初始化所有数据
  const initData = async () => {
    await Promise.all([
      loadAllTasks(),
      loadDailyTasks(),
      loadUserPoints(),
    ])
  }

  // 初始化月份数据
  const initMonthData = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    monthDates.value = Array.from({ length: daysInMonth }, (_, i) => ({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      day: i + 1,
      taskCount: Math.floor(Math.random() * 4) // 随机任务数量
    }))
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
    daySchedule,
    weekDays,
    monthDates,
    
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
    handleUpdateTask,
    handleDeleteTask,
    handleCopyToDaily,
    loadAllTasks,
    loadDailyTasks,
    loadUserPoints,
    initData,
    initMonthData
  }
}
