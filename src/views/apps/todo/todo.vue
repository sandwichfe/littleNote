<template>
  <div class="todo-container">
    <!-- 侧边栏导航 -->
    <TodoSidebar 
      :user-points="userPoints"
      :active-nav="activeNav"
      @nav-change="handleNavChange"
    />

    <!-- 主内容区域 -->
    <main class="todo-main">
      <div class="todo-main-inner">
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
      </div>
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
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f9fbff 0%, #e6f2ff 40%, #f5f7ff 100%);
}

.todo-main {
  flex: 1;
  padding: 28px 32px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.todo-main-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1120px;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(244, 247, 255, 0.94) 100%);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  box-shadow: 0 22px 60px rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(191, 219, 254, 0.52);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .todo-container {
    flex-direction: column;
  }
  
  .todo-main {
    padding: 16px;
  }

  .todo-main-inner {
    border-radius: 18px;
    padding: 18px 14px;
    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.04);
  }
}
</style>
