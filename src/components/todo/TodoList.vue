<template>
  <div class="content-section todo-list-section">
    <div class="section-header">
      <h2 class="section-title">待办列表</h2>
      <el-button 
        type="primary" 
        @click="$emit('show-add-task')"
      >
        <el-icon><Plus /></el-icon>
        创建任务
      </el-button>
    </div>
    
    <!-- 任务筛选 -->
    <div class="task-filters">
      <el-button-group>
        <el-button 
          :type="taskFilter === 'pending' ? 'primary' : 'default'"
          @click="$emit('filter-change', 'pending')"
        >
          待完成 ({{ pendingTasks.length }})
        </el-button>
        <el-button 
          :type="taskFilter === 'completed' ? 'primary' : 'default'"
          @click="$emit('filter-change', 'completed')"
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
        :class="{
          completed: task.completedCount >= task.targetCount,
          'with-progress': taskFilter === 'pending'
        }"
        :style="taskFilter === 'pending' ? { '--progress': (task.completedCount / task.targetCount * 100) + '%' } : null"
      >
      
        <div class="task-check-section">
          <el-tooltip 
            :content="task.completedCount >= task.targetCount ? '已完成' : '完成一次'" 
            placement="top"
          >
            <el-button 
              circle
              :type="task.completedCount >= task.targetCount ? 'success' : 'primary'"
              :plain="task.completedCount < task.targetCount"
              :disabled="task.completedCount >= task.targetCount"
              class="check-btn"
              @click.stop="$emit('increment-task', task)"
            >
              <el-icon v-if="task.completedCount >= task.targetCount"><Check /></el-icon>
              <el-icon v-else><Finished /></el-icon>
            </el-button>
          </el-tooltip>
          <span class="count-badge" v-if="task.targetCount > 0">
            {{ task.completedCount }}/{{ task.targetCount }}
          </span>
        </div>

        <div class="task-main-content">
          <div class="task-title" :class="{ 'is-completed': task.completedCount >= task.targetCount }">
            {{ task.content }}
          </div>
          <div class="task-meta-row">
            <el-tag 
              :type="getTaskTypeColor(task.type)" 
              size="small"
              effect="light"
              round
              class="meta-tag"
            >
              {{ getTaskTypeLabel(task.type) }}
            </el-tag>
            
            <span class="meta-item points">
              +{{ task.points }}积分
            </span>
            
            <span class="meta-divider">|</span>
            
            <span class="meta-item date">
              创建于 {{ formatDate(task.createTime || task.createdAt) }}
            </span>

            <template v-if="task.lastCompleteTime">
              <span class="meta-divider">|</span>
              <span class="meta-item date">
                {{ task.completedCount >= task.targetCount ? '完成于' : '上次完成' }} {{ formatDateTime(task.lastCompleteTime) }}
              </span>
            </template>
          </div>
        </div>

        <div class="task-action-group">
          <el-tooltip content="编辑" placement="top" :show-after="500">
            <el-button link class="action-btn" @click.stop="$emit('edit-task', task)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="复制到每日待办" placement="top" :show-after="500">
            <el-button link class="action-btn" @click.stop="$emit('copy-to-daily', task)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="删除" placement="top" :show-after="500">
            <el-button link type="danger" class="action-btn delete-btn" @click.stop="$emit('delete-task', task.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Check, Edit, Delete, CopyDocument,Finished } from '@element-plus/icons-vue'
import { useTaskStats } from '@/composables/useTaskStats'
import { useTaskUtils } from '@/composables/useTaskUtils'
import type { Task } from '@/network/todo'

// Props
const props = defineProps<{
  allTasks: Task[]
  taskFilter: 'pending' | 'completed'
}>()

// Emits
defineEmits<{
  'show-add-task': []
  'filter-change': [filter: string]
  'increment-task': [task: Task]
  'edit-task': [task: Task]
  'copy-to-daily': [task: Task]
  'delete-task': [taskId: number]
}>()

// 使用任务统计组合式函数
const { allTasksCount, pendingTasks, completedTasks } = useTaskStats(() => props.allTasks)

// 使用任务工具函数
const { getTaskTypeColor, getTaskTypeLabel, formatDate, formatDateTime } = useTaskUtils()

// 筛选后的任务列表
const filteredTasks = computed(() => {
  switch (props.taskFilter) {
    case 'pending':
      return pendingTasks.value
    case 'completed':
      return completedTasks.value
    default:
      return pendingTasks.value // 默认显示待完成任务
  }
})
</script>

<style scoped>
.content-section {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 252, 252, 0.98) 100%);
  border-radius: 18px;
  padding: 24px 24px 20px;
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: var(--todo-shadow, 0 22px 50px rgba(148, 163, 184, 0.18));
}

.todo-list-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(247, 251, 251, 0.98) 100%);
  border-color: var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), var(--todo-shadow-soft, 0 12px 32px rgba(148, 163, 184, 0.12));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--todo-text, #162033);
  margin: 0;
  letter-spacing: 0.02em;
}

.task-filters {
  margin-bottom: 20px;
}

.section-header :deep(.el-button--primary) {
  border: none;
  background: var(--todo-accent, #3dc7bc);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(61, 199, 188, 0.24);
}

.section-header :deep(.el-button--primary:hover) {
  background: var(--todo-accent-strong, #1b9c94);
}

.task-filters :deep(.el-button-group) {
  background: var(--todo-surface-soft, #f7fbfb);
  padding: 4px;
  border-radius: 999px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.task-filters :deep(.el-button-group .el-button) {
  border: none;
  background-color: transparent;
  color: var(--todo-text-secondary, #607086);
  font-weight: 600;
  border-radius: 999px;
  padding: 6px 18px;
}

.task-filters :deep(.el-button-group .el-button--primary) {
  background-image: linear-gradient(135deg, var(--todo-accent, #3dc7bc), var(--todo-accent-strong, #1b9c94));
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(61, 199, 188, 0.28);
}

.all-tasks-list {
  flex: 1;
  min-height: 0;
  height: 0;
  padding-right: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.all-tasks-list::-webkit-scrollbar {
  width: 8px;
}

.all-tasks-list::-webkit-scrollbar-track {
  background: transparent;
}

.all-tasks-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(61, 199, 188, 0.5), rgba(125, 211, 252, 0.42));
  border-radius: 999px;
}

.all-tasks-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(27, 156, 148, 0.62), rgba(96, 165, 250, 0.52));
}

.task-item-full {
  display: flex;
  align-items: flex-start;
  padding: 18px 20px;
  margin-bottom: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 253, 253, 0.98) 100%);
  border-radius: 16px;
  border: 1px solid rgba(228, 235, 241, 0.96);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.task-item-full.with-progress::before {
  content: '';
  position: absolute;
  left: 20px;
  bottom: 10px;
  height: 3px;
  width: var(--progress, 0%);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(61, 199, 188, 0.54), rgba(125, 211, 252, 0.38));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.task-item-full > * {
  position: relative;
  z-index: 1;
}

.task-item-full:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.14);
  border-color: rgba(137, 216, 208, 0.52);
}

.task-item-full.completed {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(241, 251, 249, 0.98));
  border-color: rgba(137, 216, 208, 0.42);
}

.task-item-full.with-progress.completed::before {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.7), rgba(52, 211, 153, 0.6));
}

.task-check-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 18px;
  min-width: 52px;
}

.check-btn {
  width: 36px;
  height: 36px;
  font-size: 18px;
  transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-width: 2px;
}

.check-btn:not(.is-disabled):hover {
  transform: translateY(-1px) scale(1.06);
  box-shadow: 0 8px 18px rgba(61, 199, 188, 0.26);
}

.count-badge {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
  font-weight: 600;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
}

.task-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding-right: 12px;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--todo-text, #162033);
  margin-bottom: 8px;
  line-height: 1.5;
  transition: color 0.25s;
}

.task-title.is-completed {
  color: var(--todo-text-tertiary, #94a3b8);
  text-decoration: none;
}

.task-meta-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--todo-text-tertiary, #94a3b8);
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  border: none;
  font-weight: 500;
}

.meta-divider {
  color: rgba(183, 205, 214, 0.65);
  margin: 0 4px;
  transform: scaleY(0.8);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.points {
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 600;
  background: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
  padding: 2px 10px;
  border-radius: 999px;
}

.meta-item.date {
  color: var(--todo-text-tertiary, #94a3b8);
}

.task-action-group {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateX(16px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: auto;
  padding-left: 14px;
  border-left: 1px solid rgba(228, 235, 241, 0.96);
}

.task-item-full:hover .task-action-group {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  font-size: 18px;
  padding: 6px;
  color: var(--todo-text-tertiary, #94a3b8);
  border-radius: 999px;
  transition: all 0.18s;
}

.action-btn:hover {
  color: var(--todo-accent-strong, #1b9c94);
  background-color: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
}

.action-btn.delete-btn:hover {
  color: #f97373;
  background-color: #fef2f2;
}

@media (max-width: 768px) {
  .todo-list-section {
    padding: 18px 16px 16px;
  }

  .section-header {
    gap: 12px;
    align-items: flex-start;
    flex-direction: column;
  }

  .all-tasks-list {
    padding-right: 2px;
  }

  .task-item-full {
    padding: 16px;
  }
}
</style>
