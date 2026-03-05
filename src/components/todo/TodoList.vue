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
  background: linear-gradient(135deg, #fdfdff 0%, #f7f9ff 55%, #eef4ff 100%);
  border-radius: 18px;
  padding: 24px 24px 20px;
  border: 1px solid rgba(226, 232, 255, 0.9);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
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
  color: #1f2933;
  margin: 0;
  letter-spacing: 0.02em;
}

.task-filters {
  margin-bottom: 20px;
}

.task-filters :deep(.el-button-group) {
  background: #f5f7ff;
  padding: 4px;
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.task-filters :deep(.el-button-group .el-button) {
  border: none;
  background-color: transparent;
  color: #64748b;
  font-weight: 500;
  border-radius: 999px;
  padding: 6px 18px;
}

.task-filters :deep(.el-button-group .el-button--primary) {
  background-image: linear-gradient(135deg, #8e6ff7, #4f46e5);
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35);
}

.all-tasks-list {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

.task-item-full {
  display: flex;
  align-items: flex-start;
  padding: 18px 20px;
  margin-bottom: 14px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #edf1ff;
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
  background: linear-gradient(90deg, rgba(142, 111, 247, 0.55), rgba(56, 189, 248, 0.35));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.task-item-full > * {
  position: relative;
  z-index: 1;
}

.task-item-full:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  border-color: #d4ddff;
}

.task-item-full.completed {
  background: linear-gradient(135deg, #ffffff, #f4f2ff);
  border-color: #e0d9ff;
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
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.35);
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
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.5;
  transition: color 0.25s;
}

.task-title.is-completed {
  color: #94a3b8;
  text-decoration: none;
}

.task-meta-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  border: none;
  font-weight: 500;
}

.meta-divider {
  color: #e5e7eb;
  margin: 0 4px;
  transform: scaleY(0.8);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.points {
  color: #7c3aed;
  font-weight: 600;
  background: rgba(124, 58, 237, 0.06);
  padding: 2px 10px;
  border-radius: 999px;
}

.meta-item.date {
  color: #9ca3af;
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
  border-left: 1px solid rgba(226, 232, 240, 0.9);
}

.task-item-full:hover .task-action-group {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  font-size: 18px;
  padding: 6px;
  color: #9ca3af;
  border-radius: 999px;
  transition: all 0.18s;
}

.action-btn:hover {
  color: #4f46e5;
  background-color: #eef2ff;
}

.action-btn.delete-btn:hover {
  color: #f97373;
  background-color: #fef2f2;
}
</style>
