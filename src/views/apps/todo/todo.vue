<template>
  <div class="todo-container">
    <!-- 侧边栏导航 -->
    <TodoSidebar 
      :user-info="userInfo"
      :user-points="userPoints"
      :active-nav="activeNav"
      @nav-change="setActiveNav"
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
        @copy-to-daily="handleCopyToDaily"
        @delete-task="handleDeleteTask"
      />

      <!-- 奖励超市 -->
      <RewardsShop 
        v-if="activeNav === 'rewards'"
        :rewards-list="rewardsList"
        :user-points="userPoints"
        @show-add-reward="showAddRewardDialog = true"
        @exchange-reward="handleExchangeReward"
      />

      <!-- 我的奖励 -->
      <MyRewards 
        v-if="activeNav === 'myRewards'"
        :my-rewards="myRewards"
        @use-reward="handleUseReward"
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
      v-model:show-add-reward-dialog="showAddRewardDialog"
      @add-task="handleAddTask"
      @add-reward="handleAddReward"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import TodoSidebar from '@/components/todo/TodoSidebar.vue'
import DailyTasks from '@/components/todo/DailyTasks.vue'
import TodoList from '@/components/todo/TodoList.vue'
import RewardsShop from '@/components/todo/RewardsShop.vue'
import MyRewards from '@/components/todo/MyRewards.vue'
import TaskViews from '@/components/todo/TaskViews.vue'
import TodoDialogs from '@/components/todo/TodoDialogs.vue'
import { useTodo } from '@/composables/useTodo.js'

// 使用组合式函数
const {
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
  daySchedule,
  weekDays,
  monthDates,
  showAddTaskDialog,
  showAddRewardDialog,

  // 方法
  setActiveNav,
  setActiveView,
  incrementTaskCount,
  handleAddTask,
  setTaskFilter,
  handleDeleteTask,
  handleAddReward,
  handleExchangeReward,
  handleUseReward,
  handleCopyToDaily,
  initData
} = useTodo()

onMounted(async () => {
  await initData()
})
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