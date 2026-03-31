<template>
  <div class="todo-list-layout">
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

      <div class="task-filters">
        <el-button-group>
          <el-button
            :type="taskFilter === 'pending' ? 'primary' : 'default'"
            @click="$emit('filter-change', 'pending')"
          >
            未完成 ({{ pendingCount }})
          </el-button>
          <el-button
            :type="taskFilter === 'completed' ? 'primary' : 'default'"
            @click="$emit('filter-change', 'completed')"
          >
            已完成 ({{ completedCount }})
          </el-button>
        </el-button-group>
      </div>

      <div class="all-tasks-list">
        <div
          v-for="task in allTasks"
          :key="task.id"
          class="task-item-full"
          :class="{
            completed: task.status === 1,
            'with-progress': taskFilter === 'pending',
            selected: task.id === selectedTaskId
          }"
          :style="taskFilter === 'pending' ? { '--progress': (task.completedCount / task.targetCount * 100) + '%' } : null"
          @click="$emit('select-task', task)"
        >
          <div class="task-check-section">
            <el-tooltip
              :content="task.status === 1 ? '已完成' : '完成一次'"
              placement="top"
            >
              <el-button
                circle
                :type="task.status === 1 ? 'success' : 'primary'"
                :plain="task.status !== 1"
                :disabled="task.status === 1"
                class="check-btn"
                @click.stop="$emit('increment-task', task)"
              >
                <el-icon v-if="task.status === 1"><Check /></el-icon>
                <el-icon v-else><Finished /></el-icon>
              </el-button>
            </el-tooltip>
            <span v-if="task.targetCount > 0" class="count-badge">
              {{ task.completedCount }}/{{ task.targetCount }}
            </span>
          </div>

          <div class="task-main-content">
            <div class="task-title" :class="{ 'is-completed': task.status === 1 }">
              {{ task.content }}
            </div>
            <div class="task-meta-row">
              <el-tag
                :type="getTaskTypeColor(task.type || task.taskType)"
                size="small"
                effect="light"
                round
                class="meta-tag"
              >
                {{ getTaskTypeLabel(task.type || task.taskType) }}
              </el-tag>

              <span class="meta-item points">
                +{{ task.points }} 积分
              </span>

              <span class="meta-divider">|</span>

              <span class="meta-item date">
                创建于 {{ formatDate(task.createTime || task.createdAt) }}
              </span>

              <template v-if="task.targetCount > 1">
                <span class="meta-divider">|</span>
                <span class="meta-item repeat">
                  多次任务
                </span>
              </template>

              <template v-if="taskFilter === 'pending' && task.deadline">
                <span class="meta-divider">|</span>
                <span class="meta-item deadline" :class="{ overdue: isTaskOverdue(task) }">
                  {{ isTaskOverdue(task) ? '已逾期' : '截止' }} {{ formatFriendlyDeadline(task.deadline) }}
                </span>
              </template>

              <template v-if="task.lastCompleteTime">
                <span class="meta-divider">|</span>
                <span class="meta-item date">
                  {{ task.status === 1 ? '完成于' : '上次完成' }} {{ formatDateTime(task.lastCompleteTime) }}
                </span>
              </template>
            </div>
          </div>

          <div class="task-action-group">
            <template v-if="isCompletedTask(task)">
              <el-tooltip content="详情" placement="top" :show-after="500">
                <el-button link class="action-btn" @click.stop="$emit('view-task', task)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
            </template>

            <template v-else>
              <el-tooltip content="编辑" placement="top" :show-after="500">
                <el-button link class="action-btn" @click.stop="$emit('edit-task', task)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="删除" placement="top" :show-after="500">
                <el-button link type="danger" class="action-btn delete-btn" @click.stop="$emit('delete-task', task.id!)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </div>
        </div>
      </div>
    </div>

    <aside class="content-section history-panel">
      <template v-if="selectedTask">
        <div class="history-header">
          <div>
            <p class="history-eyebrow">任务详情</p>
            <h3 class="history-title">{{ selectedTask.content }}</h3>
          </div>
          <el-tag
            :type="selectedTask.status === 1 ? 'success' : 'warning'"
            effect="light"
            round
          >
            {{ selectedTask.status === 1 ? '已完成' : '进行中' }}
          </el-tag>
        </div>

        <div class="history-summary">
          <div class="summary-card">
            <span class="summary-label">目标次数</span>
            <strong>{{ selectedTask.targetCount }}</strong>
          </div>
          <div class="summary-card">
            <span class="summary-label">已完成</span>
            <strong>{{ selectedTask.completedCount }}</strong>
          </div>
          <div class="summary-card">
            <span class="summary-label">最近一次</span>
            <strong>{{ selectedTask.lastCompleteTime ? formatDateTime(selectedTask.lastCompleteTime) : '暂无' }}</strong>
          </div>
        </div>

        <div class="history-body">
          <div class="history-section-header">
            <h4>完成记录</h4>
            <span v-if="selectedTask.targetCount > 1" class="history-hint">
              按最近完成时间排序
            </span>
          </div>

          <el-skeleton :loading="historyLoading" animated :rows="4">
            <template #default>
              <div v-if="selectedTask.targetCount <= 1" class="empty-history">
                这是单次任务，不展示多次完成历史。
              </div>

              <div v-else-if="completionRecords.length === 0" class="empty-history">
                还没有完成记录。
              </div>

              <div v-else class="history-record-list">
                <div
                  v-for="record in completionRecords"
                  :key="record.id"
                  class="history-record-item"
                >
                  <div class="history-record-index">
                    第 {{ record.completedSequence }} 次
                  </div>
                  <div class="history-record-time">
                    {{ formatDateTime(record.completedAt) }}
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
      </template>

      <div v-else class="empty-history empty-history--standalone">
        请选择一条任务查看详情和完成记录。
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Plus, Check, Edit, Delete, Finished, View } from '@element-plus/icons-vue'
import { useTaskUtils } from '@/composables/useTaskUtils'
import type { Task, TaskCompletionRecord } from '@/network/todo'

defineProps<{
  allTasks: Task[]
  taskFilter: 'pending' | 'completed'
  pendingCount: number
  completedCount: number
  selectedTask: Task | null
  selectedTaskId?: number | null
  completionRecords: TaskCompletionRecord[]
  historyLoading: boolean
}>()

defineEmits<{
  'show-add-task': []
  'filter-change': [filter: string]
  'select-task': [task: Task]
  'increment-task': [task: Task]
  'edit-task': [task: Task]
  'view-task': [task: Task]
  'delete-task': [taskId: number]
}>()

const { getTaskTypeColor, getTaskTypeLabel, formatDate, formatDateTime } = useTaskUtils()

const formatFriendlyDeadline = (deadline: string) => {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) {
    return formatDateTime(deadline)
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(todayStart.getDate() + 1)
  const dayAfterTomorrowStart = new Date(todayStart)
  dayAfterTomorrowStart.setDate(todayStart.getDate() + 2)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  if (date >= todayStart && date < tomorrowStart) {
    return `今天 ${time}`
  }

  if (date >= tomorrowStart && date < dayAfterTomorrowStart) {
    return `明天 ${time}`
  }

  return formatDateTime(deadline)
}

const isTaskOverdue = (task: Task) => {
  if (!task.deadline) {
    return false
  }
  return new Date(task.deadline).getTime() < Date.now()
}

const isCompletedTask = (task: Task) => task.status === 1
</script>

<style scoped>
.todo-list-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(320px, 0.95fr);
  gap: 18px;
  min-height: 0;
  height: 100%;
}

.content-section {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 252, 252, 0.98) 100%);
  border-radius: 18px;
  padding: 24px 24px 20px;
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: var(--todo-shadow, 0 22px 50px rgba(148, 163, 184, 0.18));
}

.todo-list-section,
.history-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.todo-list-section {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(247, 251, 251, 0.98) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), var(--todo-shadow-soft, 0 12px 32px rgba(148, 163, 184, 0.12));
}

.history-panel {
  background:
    radial-gradient(circle at top right, rgba(61, 199, 188, 0.1), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 250, 249, 0.98));
}

.section-header,
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.section-header {
  margin-bottom: 24px;
}

.section-title,
.history-title {
  margin: 0;
  color: var(--todo-text, #162033);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.history-eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--todo-accent-strong, #1b9c94);
}

.history-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
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

.all-tasks-list,
.history-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.all-tasks-list {
  padding-right: 6px;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.all-tasks-list::-webkit-scrollbar,
.history-body::-webkit-scrollbar {
  width: 8px;
}

.all-tasks-list::-webkit-scrollbar-thumb,
.history-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(61, 199, 188, 0.5), rgba(125, 211, 252, 0.42));
  border-radius: 999px;
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
  cursor: pointer;
}

.task-item-full.selected {
  border-color: rgba(61, 199, 188, 0.74);
  box-shadow: 0 16px 36px rgba(61, 199, 188, 0.16);
}

.task-item-full.selected::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(61, 199, 188, 0.32);
  pointer-events: none;
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
}

.task-title.is-completed {
  color: var(--todo-text-tertiary, #94a3b8);
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
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.points,
.meta-item.repeat {
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.meta-item.points {
  color: var(--todo-accent-strong, #1b9c94);
  background: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
}

.meta-item.repeat {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.meta-item.deadline {
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 600;
}

.meta-item.deadline.overdue {
  color: var(--todo-danger, #ef7f7f);
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

.task-item-full:hover .task-action-group,
.task-item-full.selected .task-action-group {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  font-size: 18px;
  padding: 6px;
  color: var(--todo-text-tertiary, #94a3b8);
  border-radius: 999px;
}

.action-btn:hover {
  color: var(--todo-accent-strong, #1b9c94);
  background-color: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
}

.action-btn.delete-btn:hover {
  color: #f97373;
  background-color: #fef2f2;
}

.history-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0 20px;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(228, 235, 241, 0.96);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card strong {
  font-size: 14px;
  color: var(--todo-text, #162033);
  line-height: 1.5;
}

.summary-label {
  font-size: 12px;
  color: var(--todo-text-tertiary, #94a3b8);
}

.history-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.history-section-header h4 {
  margin: 0;
  font-size: 15px;
  color: var(--todo-text, #162033);
}

.history-hint {
  font-size: 12px;
  color: var(--todo-text-tertiary, #94a3b8);
}

.history-record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-record-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(228, 235, 241, 0.96);
}

.history-record-index {
  font-size: 13px;
  font-weight: 700;
  color: var(--todo-accent-strong, #1b9c94);
  margin-bottom: 6px;
}

.history-record-time {
  font-size: 14px;
  color: var(--todo-text, #162033);
}

.empty-history {
  padding: 18px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px dashed rgba(183, 205, 214, 0.72);
  color: var(--todo-text-secondary, #607086);
  line-height: 1.7;
}

.empty-history--standalone {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

@media (max-width: 1100px) {
  .todo-list-layout {
    grid-template-columns: 1fr;
  }

  .history-panel {
    max-height: 420px;
  }
}

@media (max-width: 768px) {
  .todo-list-section,
  .history-panel {
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

  .history-summary {
    grid-template-columns: 1fr;
  }
}
</style>
