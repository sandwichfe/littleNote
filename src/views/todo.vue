<template>
  <div class="todo-container">
    <!-- 侧边栏导航 -->
    <nav class="todo-sidebar">
      <div class="sidebar-header">
        <div class="user-avatar">
          <el-avatar :size="40" :src="userInfo.avatar" />
        </div>
        <div class="user-info">
          <div class="username">{{ userInfo.nickname }}</div>
          <div class="user-role">{{ userInfo.role }}</div>
        </div>
      </div>
      
      <div class="nav-menu">
        <div 
          v-for="item in navItems" 
          :key="item.key"
          class="nav-item"
          :class="{ active: activeNav === item.key }"
          @click="setActiveNav(item.key)"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </div>
      
      <div class="points-display">
        <el-icon class="points-icon"><Star /></el-icon>
        <span class="points-text">积分: {{ userPoints }}</span>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="todo-main">
      <!-- 每日待办 -->
      <div v-if="activeNav === 'daily'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">每日待办</h2>
          <span class="date-info">{{ currentDate }}</span>
        </div>
        
        <!-- 进度统计 -->
        <div class="progress-stats">
          <div class="stat-card work">
            <div class="stat-header">
              <span class="stat-label">工作任务</span>
              <span class="stat-count">{{ workTasks.completed }}/{{ workTasks.total }}</span>
            </div>
            <el-progress 
              :percentage="workTasks.percentage" 
              color="#409EFF"
              :show-text="false"
            />
          </div>
          
          <div class="stat-card study">
            <div class="stat-header">
              <span class="stat-label">学习计划</span>
              <span class="stat-count">{{ studyTasks.completed }}/{{ studyTasks.total }}</span>
            </div>
            <el-progress 
              :percentage="studyTasks.percentage" 
              color="#67C23A"
              :show-text="false"
            />
          </div>
          
          <div class="stat-card health">
            <div class="stat-header">
              <span class="stat-label">健康习惯</span>
              <span class="stat-count">{{ healthTasks.completed }}/{{ healthTasks.total }}</span>
            </div>
            <el-progress 
              :percentage="healthTasks.percentage" 
              color="#E6A23C"
              :show-text="false"
            />
          </div>
          
          <div class="stat-card total">
            <div class="stat-header">
              <span class="stat-label">总进度</span>
              <span class="stat-count">{{ totalProgress.completed }}/{{ totalProgress.total }}</span>
            </div>
            <el-progress 
              :percentage="totalProgress.percentage" 
              color="#F56C6C"
              :show-text="false"
            />
          </div>
        </div>
        
        <!-- 任务列表 -->
        <div class="task-list">
          <div 
            v-for="task in dailyTasks" 
            :key="task.id"
            class="task-item"
            :class="{ completed: task.completed }"
          >
            <el-checkbox 
              v-model="task.completed"
              @change="toggleTask(task)"
              class="task-checkbox"
            />
            <span class="task-content">{{ task.content }}</span>
            <span class="task-points">+{{ task.points }}</span>
            <span v-if="task.completed" class="task-encouragement">{{ task.encouragement }}</span>
          </div>
        </div>
      </div>

      <!-- 待办列表 -->
      <div v-if="activeNav === 'todoList'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">待办列表</h2>
          <el-button 
            type="primary" 
            @click="showAddTaskDialog = true"
          >
            <el-icon><Plus /></el-icon>
            创建任务
          </el-button>
        </div>
        
        <!-- 任务筛选 -->
        <div class="task-filters">
          <el-button-group>
            <el-button 
              :type="taskFilter === 'all' ? 'primary' : 'default'"
              @click="setTaskFilter('all')"
            >
              全部 ({{ allTasks.length }})
            </el-button>
            <el-button 
              :type="taskFilter === 'pending' ? 'primary' : 'default'"
              @click="setTaskFilter('pending')"
            >
              待完成 ({{ pendingTasks.length }})
            </el-button>
            <el-button 
              :type="taskFilter === 'completed' ? 'primary' : 'default'"
              @click="setTaskFilter('completed')"
            >
              已完成 ({{ completedTasks.length }})
            </el-button>
          </el-button-group>
        </div>
        
        <!-- 任务列表 -->
        <div class="all-tasks-list">
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="task-item-full"
            :class="{ completed: task.completed }"
          >
            <el-checkbox 
              v-model="task.completed"
              @change="toggleTask(task)"
              class="task-checkbox"
            />
            <div class="task-details">
              <div class="task-content">{{ task.content }}</div>
              <div class="task-meta">
                <el-tag 
                  :type="getTaskTypeColor(task.type)" 
                  size="small"
                >
                  {{ getTaskTypeLabel(task.type) }}
                </el-tag>
                <span class="task-points">+{{ task.points }}积分</span>
                <span class="task-date">{{ formatDate(task.createdAt) }}</span>
              </div>
            </div>
            <div class="task-actions">
              <el-button 
                type="primary" 
                size="small" 
                text
                @click="copyToDaily(task)"
              >
                复制到每日待办
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                text
                @click="deleteTask(task.id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 奖励超市 -->
      <div v-if="activeNav === 'rewards'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">奖励超市</h2>
          <el-button 
            type="primary" 
            @click="showAddRewardDialog = true"
          >
            <el-icon><Plus /></el-icon>
            创建奖励
          </el-button>
        </div>
        
        <div class="rewards-grid">
          <div 
            v-for="reward in rewardsList" 
            :key="reward.id"
            class="reward-card"
          >
            <div class="reward-info">
              <h3 class="reward-name">{{ reward.name }}</h3>
              <p class="reward-desc">{{ reward.description }}</p>
            </div>
            <div class="reward-action">
              <span class="reward-points">{{ reward.points }}积分</span>
              <el-button 
                type="primary" 
                size="small"
                :disabled="userPoints < reward.points"
                @click="exchangeReward(reward)"
              >
                兑换
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的奖励 -->
      <div v-if="activeNav === 'myRewards'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">我的奖励</h2>
        </div>
        
        <div class="my-rewards-list">
          <div 
            v-for="reward in myRewards" 
            :key="reward.id"
            class="my-reward-item"
          >
            <div class="reward-info">
              <h3 class="reward-name">{{ reward.name }}</h3>
              <p class="reward-date">获得时间: {{ reward.obtainedDate }}</p>
            </div>
            <el-button 
              type="success" 
              size="small"
              @click="useReward(reward)"
            >
              使用
            </el-button>
          </div>
        </div>
      </div>

      <!-- 任务视图 -->
      <div v-if="activeNav === 'taskViews'" class="content-section">
        <div class="section-header">
          <h2 class="section-title">任务视图</h2>
          <div class="view-buttons">
            <el-button 
              v-for="view in viewTypes" 
              :key="view.key"
              :type="activeView === view.key ? 'primary' : 'default'"
              size="small"
              @click="setActiveView(view.key)"
            >
              {{ view.label }}
            </el-button>
          </div>
        </div>
        
        <!-- 日视图 -->
        <div v-if="activeView === 'day'" class="day-view">
          <h3 class="view-title">{{ currentDate }}</h3>
          <div class="day-schedule">
            <div 
              v-for="hour in daySchedule" 
              :key="hour.time"
              class="hour-slot"
            >
              <div class="time-label">{{ hour.time }}</div>
              <div class="hour-content">
                <div 
                  v-for="task in hour.tasks" 
                  :key="task.id"
                  class="scheduled-task"
                  :class="task.type"
                >
                  {{ task.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 周视图 -->
        <div v-if="activeView === 'week'" class="week-view">
          <h3 class="view-title">{{ currentWeek }}</h3>
          <div class="week-grid">
            <div 
              v-for="day in weekDays" 
              :key="day.date"
              class="week-day"
            >
              <div class="day-header">{{ day.label }}</div>
              <div class="day-tasks">{{ day.taskCount }}个任务</div>
            </div>
          </div>
        </div>
        
        <!-- 月视图 -->
        <div v-if="activeView === 'month'" class="month-view">
          <h3 class="view-title">{{ currentMonth }}</h3>
          <div class="month-calendar">
            <div class="calendar-header">
              <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="day-name">
                {{ day }}
              </div>
            </div>
            <div class="calendar-body">
              <div 
                v-for="date in monthDates" 
                :key="date.date"
                class="calendar-date"
                :class="{ 'has-tasks': date.taskCount > 0 }"
              >
                <div class="date-number">{{ date.day }}</div>
                <div v-if="date.taskCount > 0" class="date-tasks">
                  {{ date.taskCount }}个任务
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加任务对话框 -->
    <el-dialog 
      v-model="showAddTaskDialog" 
      title="添加新待办" 
      width="500px"
    >
      <el-form :model="newTask" label-width="80px">
        <el-form-item label="任务名称">
          <el-input v-model="newTask.content" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="newTask.type" placeholder="请选择任务类型">
            <el-option label="工作任务" value="work" />
            <el-option label="学习计划" value="study" />
            <el-option label="健康习惯" value="health" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分奖励">
          <el-input-number v-model="newTask.points" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="鼓励语">
          <el-input v-model="newTask.encouragement" placeholder="完成后的鼓励语" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="addTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加奖励对话框 -->
    <el-dialog 
      v-model="showAddRewardDialog" 
      title="创建新奖励" 
      width="500px"
    >
      <el-form :model="newReward" label-width="80px">
        <el-form-item label="奖励名称">
          <el-input v-model="newReward.name" placeholder="请输入奖励名称" />
        </el-form-item>
        <el-form-item label="奖励描述">
          <el-input v-model="newReward.description" placeholder="请输入奖励描述" />
        </el-form-item>
        <el-form-item label="所需积分">
          <el-input-number v-model="newReward.points" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRewardDialog = false">取消</el-button>
        <el-button type="primary" @click="addReward">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Calendar, 
  Trophy, 
  Present, 
  Star, 
  Plus,
  Clock,
  User,
  List
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 用户信息
const userInfo = ref({
  nickname: 'Sarah Wilson',
  role: '设计师',
  avatar: 'https://49.235.149.110/favicon.ico'
})

// 用户积分
const userPoints = ref(280)

// 当前激活的导航
const activeNav = ref('daily')

// 导航菜单项
const navItems = [
  { key: 'daily', label: '每日待办', icon: Calendar },
  { key: 'todoList', label: '待办列表', icon: List },
  { key: 'rewards', label: '奖励超市', icon: Present },
  { key: 'myRewards', label: '我的奖励', icon: Trophy },
  { key: 'taskViews', label: '任务视图', icon: Clock }
]

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  return `${year}年${month}月${day}日 ${weekDay}`
})

// 全局任务列表
const allTasks = ref([
  {
    id: 1,
    content: '完成产品设计方案',
    type: 'work',
    points: 40,
    completed: false,
    encouragement: '加油，这个任务很重要！',
    createdAt: new Date('2025-01-06')
  },
  {
    id: 2,
    content: '阅读一章专业书籍',
    type: 'study',
    points: 20,
    completed: false,
    encouragement: '坚持阅读，成长更快～',
    createdAt: new Date('2025-01-06')
  },
  {
    id: 3,
    content: '晨跑 30 分钟',
    type: 'health',
    points: 10,
    completed: true,
    encouragement: '运动让生活更有活力！',
    createdAt: new Date('2025-01-06')
  },
  {
    id: 4,
    content: '准备周会PPT',
    type: 'work',
    points: 30,
    completed: false,
    encouragement: '认真准备，展示你的能力！',
    createdAt: new Date('2025-01-05')
  },
  {
    id: 5,
    content: '学习Vue3新特性',
    type: 'study',
    points: 25,
    completed: true,
    encouragement: '技术进步，未来可期！',
    createdAt: new Date('2025-01-04')
  }
])

// 每日任务数据（独立的每日待办列表）
const dailyTasks = ref([
  {
    id: 1001,
    content: '完成产品设计方案',
    type: 'work',
    points: 40,
    completed: false,
    encouragement: '加油，这个任务很重要！',
    createdAt: new Date('2025-01-06'),
    originalId: 1 // 记录原始任务ID
  },
  {
    id: 1002,
    content: '阅读一章专业书籍',
    type: 'study',
    points: 20,
    completed: false,
    encouragement: '坚持阅读，成长更快～',
    createdAt: new Date('2025-01-06'),
    originalId: 2
  },
  {
    id: 1003,
    content: '晨跑 30 分钟',
    type: 'health',
    points: 10,
    completed: true,
    encouragement: '运动让生活更有活力！',
    createdAt: new Date('2025-01-06'),
    originalId: 3
  }
])

// 任务筛选状态
const taskFilter = ref('all')

// 任务统计
const workTasks = computed(() => {
  const work = dailyTasks.value.filter(task => task.type === 'work')
  const completed = work.filter(task => task.completed).length
  return {
    total: work.length,
    completed,
    percentage: work.length > 0 ? Math.round((completed / work.length) * 100) : 0
  }
})

const studyTasks = computed(() => {
  const study = dailyTasks.value.filter(task => task.type === 'study')
  const completed = study.filter(task => task.completed).length
  return {
    total: study.length,
    completed,
    percentage: study.length > 0 ? Math.round((completed / study.length) * 100) : 0
  }
})

const healthTasks = computed(() => {
  const health = dailyTasks.value.filter(task => task.type === 'health')
  const completed = health.filter(task => task.completed).length
  return {
    total: health.length,
    completed,
    percentage: health.length > 0 ? Math.round((completed / health.length) * 100) : 0
  }
})

const totalProgress = computed(() => {
  const total = dailyTasks.value.length
  const completed = dailyTasks.value.filter(task => task.completed).length
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
})

// 任务筛选相关计算属性
const pendingTasks = computed(() => {
  return allTasks.value.filter(task => !task.completed)
})

const completedTasks = computed(() => {
  return allTasks.value.filter(task => task.completed)
})

const filteredTasks = computed(() => {
  switch (taskFilter.value) {
    case 'pending':
      return pendingTasks.value
    case 'completed':
      return completedTasks.value
    default:
      return allTasks.value
  }
})

// 奖励列表
const rewardsList = ref([
  {
    id: 1,
    name: '精美电影票',
    description: '周末看场期待已久的电影',
    points: 200
  },
  {
    id: 2,
    name: '按摩放松',
    description: '犒劳一下辛苦工作的自己',
    points: 300
  },
  {
    id: 3,
    name: '新款数码产品',
    description: '为生活添加一些科技感',
    points: 500
  }
])

// 我的奖励
const myRewards = ref([
  {
    id: 1,
    name: '美味火锅',
    obtainedDate: '2024-01-15'
  },
  {
    id: 2,
    name: '新游戏',
    obtainedDate: '2024-01-10'
  }
])

// 任务视图相关
const activeView = ref('day')
const viewTypes = [
  { key: 'day', label: '日视图' },
  { key: 'week', label: '周视图' },
  { key: 'month', label: '月视图' }
]

// 日程安排
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

// 周视图数据
const currentWeek = ref('2025年第1周')
const weekDays = ref([
  { label: '周一 1/6', date: '2025-01-06', taskCount: 4 },
  { label: '周二 1/7', date: '2025-01-07', taskCount: 3 },
  { label: '周三 1/8', date: '2025-01-08', taskCount: 5 },
  { label: '周四 1/9', date: '2025-01-09', taskCount: 2 },
  { label: '周五 1/10', date: '2025-01-10', taskCount: 4 },
  { label: '周六 1/11', date: '2025-01-11', taskCount: 1 },
  { label: '周日 1/12', date: '2025-01-12', taskCount: 2 }
])

// 月视图数据
const currentMonth = ref('2025年1月')
const monthDates = ref([
  { date: '2025-01-01', day: 1, taskCount: 0 },
  { date: '2025-01-02', day: 2, taskCount: 3 },
  { date: '2025-01-03', day: 3, taskCount: 2 },
  // ... 更多日期数据
])

// 对话框状态
const showAddTaskDialog = ref(false)
const showAddRewardDialog = ref(false)

// 新任务表单
const newTask = reactive({
  content: '',
  type: 'work',
  points: 10,
  encouragement: ''
})

// 新奖励表单
const newReward = reactive({
  name: '',
  description: '',
  points: 100
})

// 方法
const setActiveNav = (nav) => {
  activeNav.value = nav
}

const setActiveView = (view) => {
  activeView.value = view
}

const toggleTask = (task) => {
  if (task.completed) {
    userPoints.value += task.points
    ElMessage.success(`完成任务获得 ${task.points} 积分！`)
  } else {
    userPoints.value -= task.points
  }
}

const addTask = () => {
  const task = {
    id: Date.now(),
    content: newTask.content,
    type: newTask.type,
    points: newTask.points,
    completed: false,
    encouragement: newTask.encouragement || '任务完成，继续加油！',
    createdAt: new Date()
  }
  
  allTasks.value.push(task)
  
  // 重置表单
  Object.assign(newTask, {
    content: '',
    type: 'work',
    points: 10,
    encouragement: ''
  })
  
  showAddTaskDialog.value = false
  ElMessage.success('任务添加成功！')
}

// 设置任务筛选
const setTaskFilter = (filter) => {
  taskFilter.value = filter
}

// 删除任务
const deleteTask = (taskId) => {
  const index = allTasks.value.findIndex(task => task.id === taskId)
  if (index > -1) {
    allTasks.value.splice(index, 1)
    ElMessage.success('任务删除成功！')
  }
}

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  switch (type) {
    case 'work':
      return 'primary'
    case 'study':
      return 'success'
    case 'health':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取任务类型标签
const getTaskTypeLabel = (type) => {
  switch (type) {
    case 'work':
      return '工作任务'
    case 'study':
      return '学习计划'
    case 'health':
      return '健康习惯'
    default:
      return '其他'
  }
}

// 格式化日期
const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

const addReward = () => {
  const reward = {
    id: Date.now(),
    name: newReward.name,
    description: newReward.description,
    points: newReward.points
  }
  
  rewardsList.value.push(reward)
  
  // 重置表单
  Object.assign(newReward, {
    name: '',
    description: '',
    points: 100
  })
  
  showAddRewardDialog.value = false
  ElMessage.success('奖励创建成功！')
}

const exchangeReward = (reward) => {
  if (userPoints.value >= reward.points) {
    userPoints.value -= reward.points
    myRewards.value.push({
      id: Date.now(),
      name: reward.name,
      obtainedDate: new Date().toISOString().split('T')[0]
    })
    ElMessage.success(`成功兑换 ${reward.name}！`)
  } else {
    ElMessage.warning('积分不足，无法兑换！')
  }
}

const useReward = (reward) => {
  const index = myRewards.value.findIndex(r => r.id === reward.id)
  if (index > -1) {
    myRewards.value.splice(index, 1)
    ElMessage.success(`已使用 ${reward.name}！`)
  }
}

// 复制任务到每日待办
const copyToDaily = (task) => {
  // 检查是否已经存在相同的任务
  const exists = dailyTasks.value.some(dailyTask => dailyTask.originalId === task.id)
  if (exists) {
    ElMessage.warning('该任务已存在于每日待办中！')
    return
  }
  
  const dailyTask = {
    id: Date.now() + Math.random(), // 确保唯一ID
    content: task.content,
    type: task.type,
    points: task.points,
    completed: false,
    encouragement: task.encouragement,
    createdAt: new Date(),
    originalId: task.id
  }
  
  dailyTasks.value.push(dailyTask)
  ElMessage.success('任务已复制到每日待办！')
}

onMounted(() => {
  // 初始化月份日期数据
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  monthDates.value = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
    day: i + 1,
    taskCount: Math.floor(Math.random() * 4) // 随机任务数量
  }))
})
</script>

<style scoped>
.todo-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(to bottom, #fef7f7, #e3f2fd);
}

.todo-sidebar {
  width: 260px;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.user-avatar {
  margin-bottom: 12px;
}

.user-info {
  text-align: center;
}

.username {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-role {
  font-size: 14px;
  color: #666;
}

.nav-menu {
  flex: 1;
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.nav-item:hover {
  background: #fce4ec;
  color: #8e6ff7;
}

.nav-item.active {
  background: #8e6ff7;
  color: white;
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
}

.nav-label {
  font-weight: 500;
}

.points-display {
  padding: 16px 24px;
  background: #fce4ec;
  margin: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-icon {
  color: #ffc107;
  font-size: 18px;
}

.points-text {
  font-weight: 600;
  color: #333;
}

.todo-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.content-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.date-info {
  color: #666;
  font-size: 14px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
}

.stat-card.work {
  background: #e3f2fd;
}

.stat-card.study {
  background: #e8f5e8;
}

.stat-card.health {
  background: #fff3e0;
}

.stat-card.total {
  background: #fce4ec;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-weight: 600;
  color: #333;
}

.stat-count {
  font-weight: 600;
  color: #666;
}

.task-list {
  margin-bottom: 24px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: #fce4ec;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-item.completed {
  opacity: 0.7;
  background: #f0f0f0;
}

.task-checkbox {
  margin-right: 16px;
}

.task-content {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.task-item.completed .task-content {
  text-decoration: line-through;
  color: #999;
}

.task-points {
  background: #8e6ff7;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 12px;
}

.task-encouragement {
  position: absolute;
  top: -8px;
  right: 16px;
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.add-task-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
}

/* 待办列表样式 */
.task-filters {
  margin-bottom: 24px;
}

.all-tasks-list {
  max-height: 600px;
  overflow-y: auto;
}

.task-item-full {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #8e6ff7;
  transition: all 0.3s ease;
}

.task-item-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.task-item-full.completed {
  opacity: 0.7;
  background: #f0f0f0;
  border-left-color: #ccc;
}

.task-details {
  flex: 1;
  margin-left: 16px;
}

.task-details .task-content {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.task-item-full.completed .task-details .task-content {
  text-decoration: line-through;
  color: #999;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.task-meta .task-points {
  background: #8e6ff7;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.task-date {
  color: #999;
  font-size: 12px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.reward-card {
  padding: 20px;
  background: #fce4ec;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reward-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 600;
}

.reward-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.reward-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.reward-points {
  color: #8e6ff7;
  font-weight: 600;
}

.my-rewards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.my-reward-item {
  padding: 20px;
  background: #e8f5e8;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reward-date {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 14px;
}

.view-buttons {
  display: flex;
  gap: 8px;
}

.day-view,
.week-view,
.month-view {
  margin-top: 24px;
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.day-schedule {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hour-slot {
  display: flex;
  align-items: center;
  min-height: 60px;
  border-bottom: 1px solid #f0f0f0;
}

.time-label {
  width: 80px;
  font-size: 14px;
  color: #666;
  text-align: right;
  padding-right: 16px;
}

.hour-content {
  flex: 1;
  padding-left: 16px;
}

.scheduled-task {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 4px;
}

.scheduled-task.work {
  background: #e3f2fd;
  color: #1976d2;
}

.scheduled-task.study {
  background: #e8f5e8;
  color: #388e3c;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.week-day {
  padding: 16px;
  background: #fce4ec;
  border-radius: 8px;
  text-align: center;
}

.day-header {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.day-tasks {
  color: #8e6ff7;
  font-size: 14px;
}

.month-calendar {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f5f5;
}

.day-name {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-date {
  min-height: 80px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.calendar-date.has-tasks {
  background: #fce4ec;
}

.date-number {
  font-weight: 600;
  color: #333;
}

.date-tasks {
  margin-top: 4px;
  font-size: 12px;
  color: #8e6ff7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .todo-container {
    flex-direction: column;
  }
  
  .todo-sidebar {
    width: 100%;
    height: auto;
  }
  
  .progress-stats {
    grid-template-columns: 1fr;
  }
  
  .rewards-grid {
    grid-template-columns: 1fr;
  }
  
  .week-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>