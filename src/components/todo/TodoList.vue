<template>
  <div class="content-section">
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
          :type="taskFilter === 'all' ? 'primary' : 'default'"
          @click="$emit('filter-change', 'all')"
        >
          全部 ({{ allTasksCount }})
        </el-button>
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
        :class="{ completed: task.completedCount >= task.targetCount }"
        :style="{ '--progress': (task.completedCount / task.targetCount * 100) + '%' }"
      >
        <div class="task-progress">
          <el-button 
            size="small" 
            type="primary" 
            :disabled="task.completedCount >= task.targetCount"
            @click="$emit('increment-task', task)"
          >
            完成一次
          </el-button>
          <span class="count-display">{{ task.completedCount }}/{{ task.targetCount }}</span>
        </div>
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
            @click="$emit('copy-to-daily', task)"
          >
            复制到每日待办
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            text
            @click="$emit('delete-task', task.id)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useTaskStats } from '@/composables/useTaskStats'
import { useTaskUtils } from '@/composables/useTaskUtils'
import type { Task } from '@/network/todo'

// Props
const props = defineProps<{
  allTasks: Task[]
  taskFilter: 'all' | 'pending' | 'completed'
}>()

// Emits
defineEmits<{
  'show-add-task': []
  'filter-change': [filter: string]
  'increment-task': [task: Task]
  'copy-to-daily': [task: Task]
  'delete-task': [taskId: number]
}>()

// 使用任务统计组合式函数
const { allTasksCount, pendingTasks, completedTasks } = useTaskStats(props.allTasks)

// 使用任务工具函数
const { getTaskTypeColor, getTaskTypeLabel, formatDate } = useTaskUtils()

// 筛选后的任务列表
const filteredTasks = computed(() => {
  switch (props.taskFilter) {
    case 'pending':
      return pendingTasks.value
    case 'completed':
      return completedTasks.value
    default:
      return Array.isArray(props.allTasks) ? props.allTasks : []
  }
})
</script>

<style scoped>
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
  position: relative;
  overflow: hidden;
}

.task-item-full::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, #e8f5e8, #c8e6c9);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.task-item-full > * {
  position: relative;
  z-index: 1;
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

.task-item-full.completed::before {
  background: linear-gradient(90deg, #81c784, #4caf50);
  animation: completedPulse 2s ease-in-out;
}

@keyframes completedPulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  }
  100% {
    opacity: 0.8;
  }
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
}

.count-display {
  font-weight: 600;
  color: #666;
  font-size: 14px;
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
</style>