<template>
  <div class="todo-container">
    <!-- 侧边栏导航 -->
    <TodoSidebar 
      :user-info="userInfo"
      :user-points="userPoints"
      :active-nav="activeNav"
      @nav-change="handleNavChange"
    />

    <!-- 主内容区域 -->
    <main class="todo-main">
      <!-- 每日待办 -->
      <DailyTasks 
        v-if="activeNav === 'daily'"
        :daily-tasks="dailyTasks"
        @increment-task="incrementTaskCount"
      />

      <!-- 待办列表 -->
      <TodoList 
        v-if="activeNav === 'todoList'"
        :all-tasks="allTasks"
        :task-filter="taskFilter"
        @show-add-task="showAddTaskDialog = true"
        @filter-change="setTaskFilter"
        @increment-task="incrementTaskCount"
        @edit-task="handleEditTask"
        @copy-to-daily="handleCopyToDaily"
        @delete-task="handleDeleteTask"
      />

      <!-- 任务视图 -->
      <TaskViews 
        v-if="activeNav === 'taskViews'"
        :active-view="activeView"
        :day-schedule="daySchedule"
        :week-days="weekDays"
        :month-dates="monthDates"
        @view-change="setActiveView"
      />
    </main>

    <!-- 对话框组件 -->
    <TodoDialogs 
      v-model:show-add-task-dialog="showAddTaskDialog"
      v-model:show-edit-task-dialog="showEditTaskDialog"
      v-model:show-add-reward-dialog="showAddRewardDialog"
      :editing-task="editingTask"
      @add-task="handleAddTask"
      @update-task="handleUpdateTask"
      @add-reward="handleAddReward"
    />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TodoSidebar from '@/components/todo/TodoSidebar.vue'
import DailyTasks from '@/components/todo/DailyTasks.vue'
import TodoList from '@/components/todo/TodoList.vue'
import TaskViews from '@/components/todo/TaskViews.vue'
import TodoDialogs from '@/components/todo/TodoDialogs.vue'
import { useTodo } from '@/composables/useTodo.js'

const route = useRoute()
const router = useRouter()

// 使用组合式函数
const {
  // 状态
  userInfo,
  userPoints,
  activeNav,
  allTasks,
  dailyTasks,
  taskFilter,
  activeView,
  daySchedule,
  weekDays,
  monthDates,
  showAddTaskDialog,
  showEditTaskDialog,
  showAddRewardDialog,
  editingTask,

  // 方法
  setActiveNav,
  setActiveView,
  incrementTaskCount,
  handleAddTask,
  handleEditTask,
  handleUpdateTask,
  setTaskFilter,
  handleDeleteTask,
  handleAddReward,
  handleCopyToDaily,
  initData
} = useTodo()

const syncActiveNavWithRoute = async (section) => {
  const nav = typeof section === 'string' && section.length ? section : 'daily'
  if (nav === activeNav.value && nav !== 'daily') {
    return
  }
  await setActiveNav(nav)
}

const handleNavChange = (nav) => {
  const currentSection = typeof route.params.section === 'string' ? route.params.section : undefined
  if (nav === currentSection) {
    return
  }
  router.push({
    name: 'Todo',
    params: { section: nav }
  })
}

onMounted(async () => {
  await initData()
  await syncActiveNavWithRoute(route.params.section)
})

watch(
  () => route.params.section,
  (newSection) => {
    syncActiveNavWithRoute(newSection)
  }
)
</script>

<style scoped>
.todo-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(to bottom, #fef7f7, #e3f2fd);
}

.todo-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .todo-container {
    flex-direction: column;
  }
  
  .todo-main {
    padding: 15px;
  }
}
</style>
