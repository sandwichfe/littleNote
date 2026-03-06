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
          @view-task="handleViewTask"
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
      :edit-task-read-only="editTaskReadOnly"
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
  editTaskReadOnly,

  // 方法
  setActiveNav,
  setActiveView,
  incrementTaskCount,
  handleAddTask,
  handleEditTask,
  handleViewTask,
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
    padding: 0;
  }
}
</style>
<style scoped>
.todo-container {
  --todo-surface: rgba(255, 255, 255, 0.96);
  --todo-surface-soft: #f7fbfb;
  --todo-border: rgba(208, 220, 228, 0.92);
  --todo-border-strong: rgba(183, 205, 214, 0.7);
  --todo-text: #162033;
  --todo-text-secondary: #607086;
  --todo-text-tertiary: #94a3b8;
  --todo-accent: #3dc7bc;
  --todo-accent-strong: #1b9c94;
  --todo-accent-soft: rgba(61, 199, 188, 0.12);
  --todo-accent-faint: rgba(61, 199, 188, 0.06);
  --todo-success: #2fb479;
  --todo-warning: #efb343;
  --todo-danger: #ef7f7f;
  --todo-shadow: 0 22px 50px rgba(148, 163, 184, 0.18);
  --todo-shadow-soft: 0 12px 32px rgba(148, 163, 184, 0.12);

  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(circle at 0% 0%, rgba(104, 221, 206, 0.2), transparent 32%),
    radial-gradient(circle at 100% 8%, rgba(184, 232, 255, 0.28), transparent 28%),
    linear-gradient(180deg, #f7fbfb 0%, #eef7f7 42%, #f8fbff 100%);
}

.todo-main {
  min-width: 0;
  padding: 20px 24px 20px 16px;
}

.todo-main-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  max-width: 1280px;
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  border-radius: 0;
  box-shadow: none;
  border: 0;
  overflow: hidden;
}

.todo-main-inner > * {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1024px) {
  .todo-main {
    padding: 16px 18px 18px;
  }

  .todo-main-inner {
    padding: 0;
  }
}

@media (max-width: 768px) {
  .todo-container {
    flex-direction: column;
    height: auto;
    overflow: auto;
  }

  .todo-main {
    padding: 0 14px 14px;
  }

  .todo-main-inner {
    padding: 0;
  }
}
</style>
