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
  getRewards, 
  addReward, 
  exchangeReward, 
  getUserRewards, 
  useReward
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
  const taskFilter = ref('all')
  const rewardsList = ref([])
  const myRewards = ref([])
  const activeView = ref('day')
  const showAddTaskDialog = ref(false)
  const showAddRewardDialog = ref(false)

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
        return Array.isArray(allTasks.value) ? allTasks.value : []
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
        
        // 刷新用户积分
        await loadUserPoints()
      } catch (error) {
        ElMessage.error('完成任务失败')
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
      targetCount: taskData.targetCount || 1
    }
    
    try {
      const result = await addTask(task)
      if (!Array.isArray(allTasks.value)) {
        allTasks.value = []
      }
      
      // 处理API响应格式 {code, msg, data, time}
      const taskData = result && result.data ? result.data : result
      allTasks.value.push(taskData)
      
      showAddTaskDialog.value = false
      ElMessage.success('任务添加成功！')
    } catch (error) {
      console.error('添加任务失败:', error)
      ElMessage.error('添加任务失败')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      const tasks = Array.isArray(allTasks.value) ? allTasks.value : []
      const index = tasks.findIndex(task => task.id === taskId)
      if (index > -1 && Array.isArray(allTasks.value)) {
        allTasks.value.splice(index, 1)
      }
      ElMessage.success('任务删除成功！')
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

  const handleAddReward = async (rewardData) => {
    if (!rewardData.name || !rewardData.description) {
      ElMessage.warning('请填写完整的奖励信息')
      return
    }
    
    const reward = {
      name: rewardData.name,
      description: rewardData.description,
      points: rewardData.points,
      status: 1
    }
    
    try {
      const result = await addReward(reward)
      if (!Array.isArray(rewardsList.value)) {
        rewardsList.value = []
      }
      
      // 处理API响应格式 {code, msg, data, time}
      const rewardData = result && result.data ? result.data : result
      rewardsList.value.push(rewardData)
      
      showAddRewardDialog.value = false
      ElMessage.success('奖励创建成功！')
    } catch (error) {
      ElMessage.error('创建奖励失败')
    }
  }

  const handleExchangeReward = async (reward) => {
    const requiredPoints = reward.requiredPoints || reward.points
    if (userPoints.value >= requiredPoints) {
      try {
        await exchangeReward(reward.id)
        ElMessage.success(`成功兑换 ${reward.name}！`)
        // 重新获取用户积分
        await loadUserPoints()
        // 刷新我的奖励列表
        await loadMyRewards()
      } catch (error) {
        ElMessage.error('兑换失败')
      }
    } else {
      ElMessage.warning('积分不足，无法兑换！')
    }
  }

  const handleUseReward = async (reward) => {
    try {
      await useReward(reward.id)
      const rewards = Array.isArray(myRewards.value) ? myRewards.value : []
      const index = rewards.findIndex(r => r.id === reward.id)
      if (index > -1 && Array.isArray(myRewards.value)) {
        myRewards.value.splice(index, 1)
      }
      ElMessage.success(`已使用 ${reward.name}！`)
    } catch (error) {
      ElMessage.error('使用奖励失败')
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
        userPoints.value = result.data.availablePoints || result.data.points || 0
      } else {
        userPoints.value = result.availablePoints || result.points || 0
      }
    } catch (error) {
      console.error('加载用户积分失败:', error)
    }
  }

  const loadRewards = async () => {
    try {
      const result = await getRewards()
      // 处理API响应格式 {code, msg, data, time}
      if (result && result.data) {
        rewardsList.value = Array.isArray(result.data) ? result.data : result.data.records || []
      } else {
        rewardsList.value = result.records || result || []
      }
    } catch (error) {
      console.error('加载奖励列表失败:', error)
      rewardsList.value = []
    }
  }

  const loadMyRewards = async () => {
    try {
      const result = await getUserRewards()
      // 处理API响应格式 {code, msg, data, time}
      if (result && result.data) {
        myRewards.value = Array.isArray(result.data) ? result.data : result.data.records || []
      } else {
        myRewards.value = result.records || result || []
      }
    } catch (error) {
      console.error('加载我的奖励失败:', error)
      myRewards.value = []
    }
  }

  // 初始化所有数据
  const initData = async () => {
    await Promise.all([
      loadAllTasks(),
      loadDailyTasks(),
      loadUserPoints(),
      loadRewards(),
      loadMyRewards()
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
    showAddRewardDialog,
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
    handleDeleteTask,
    handleCopyToDaily,
    handleAddReward,
    handleExchangeReward,
    handleUseReward,
    loadAllTasks,
    loadDailyTasks,
    loadUserPoints,
    loadRewards,
    loadMyRewards,
    initData,
    initMonthData
  }
}