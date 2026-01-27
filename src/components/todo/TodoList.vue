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
  align-items: center;
  padding: 20px;
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 12px;
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

.task-check-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  min-width: 48px;
}

.check-btn {
  width: 36px;
  height: 36px;
  font-size: 18px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-width: 2px;
}

.check-btn:not(.is-disabled):hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.count-badge {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  font-weight: 600;
  font-family: monospace;
}

.task-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding-right: 16px;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
  transition: color 0.3s;
}

.task-title.is-completed {
  color: #909399;
  text-decoration: line-through;
}

.task-meta-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #909399;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  border: none;
  font-weight: 500;
}

.meta-divider {
  color: #e4e7ed;
  margin: 0 4px;
  transform: scaleY(0.8);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.points {
  color: #8e6ff7;
  font-weight: 600;
  background: rgba(142, 111, 247, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.meta-item.date {
  color: #a8abb2;
}

.task-action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: auto;
  padding-left: 16px;
  border-left: 1px solid transparent;
}

.task-item-full:hover .task-action-group {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  font-size: 18px;
  padding: 8px;
  color: #909399;
  border-radius: 8px;
  transition: all 0.2s;
}

.action-btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.action-btn.delete-btn:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}
</style>