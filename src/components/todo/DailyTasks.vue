<template>
  <div class="content-section">
    <div class="section-header">
      <h2 class="section-title">每日待办</h2>
      <span class="date-info">{{ currentDate }}</span>
    </div>
    

    
    <!-- 任务列表 -->
    <div class="task-list">
      
      <div 
        v-for="task in dailyTasks" 
        :key="task.id"
        class="task-item"
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
        <span class="task-content">{{ task.content }}</span>
        <span class="task-points">+{{ task.points }}</span>
        <span v-if="task.completedCount >= task.targetCount" class="task-encouragement">{{ task.encouragement }}</span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTaskUtils } from '@/composables/useTaskUtils'
import type { Task } from '@/network/todo'

// Props
const props = defineProps<{
  dailyTasks: Task[]
}>()

// Emits
defineEmits<{
  'increment-task': [task: Task]
}>()

// 使用工具函数
const { getCurrentDateString } = useTaskUtils()

// 当前日期
const currentDate = computed(() => getCurrentDateString())
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

.date-info {
  color: #666;
  font-size: 14px;
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
  overflow: hidden;
}

.task-item::before {
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

.task-item > * {
  position: relative;
  z-index: 1;
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

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-item.completed {
  opacity: 0.7;
  background: #f0f0f0;
}

.task-item.completed::before {
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

/* 响应式设计 */
@media (max-width: 768px) {
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .task-progress {
    margin-right: 0;
  }
}
</style>
<style scoped>
.content-section {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 252, 252, 0.98) 100%);
  border-radius: 30px;
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: var(--todo-shadow, 0 22px 50px rgba(148, 163, 184, 0.18));
  overflow: hidden;
}

.content-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 40%, rgba(198, 245, 239, 0.18) 100%);
  pointer-events: none;
}

.content-section > * {
  position: relative;
  z-index: 1;
}

.section-header {
  margin-bottom: 24px;
  gap: 14px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 28px;
  color: var(--todo-text, #162033);
}

.date-info {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--todo-surface-soft, #f7fbfb);
  color: var(--todo-text-secondary, #607086);
  font-size: 13px;
  font-weight: 600;
}

.task-list {
  flex: 1;
  min-height: 0;
  margin-bottom: 0;
  padding-right: 4px;
  margin-right: -4px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.task-list::-webkit-scrollbar {
  width: 7px;
}

.task-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(61, 199, 188, 0.42), rgba(61, 199, 188, 0.2));
  border-radius: 999px;
}

.task-item {
  align-items: center;
  gap: 16px;
  padding: 18px;
  margin-bottom: 0;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdfd 100%);
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(148, 163, 184, 0.12);
}

.task-item::before {
  top: auto;
  bottom: 12px;
  left: 18px;
  height: 4px;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, rgba(61, 199, 188, 0.75), rgba(104, 211, 198, 0.4));
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(148, 163, 184, 0.16);
  border-color: rgba(137, 216, 208, 0.48);
}

.task-item.completed {
  opacity: 1;
  background: linear-gradient(180deg, #ffffff 0%, #f5fbf9 100%);
  border-color: rgba(169, 226, 214, 0.58);
}

.task-item.completed::before {
  background: linear-gradient(90deg, rgba(47, 180, 121, 0.78), rgba(86, 201, 145, 0.42));
  animation: none;
}

.task-progress {
  gap: 10px;
  margin-right: 0;
  flex-shrink: 0;
}

:deep(.task-progress .el-button) {
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #44c9bf 0%, #2ea79f 100%);
  box-shadow: 0 12px 24px rgba(61, 199, 188, 0.24);
}

:deep(.task-progress .el-button:hover) {
  transform: translateY(-1px);
}

:deep(.task-progress .el-button.is-disabled) {
  background: #eef3f6;
  color: #9aabb8;
  box-shadow: none;
}

.count-display {
  min-width: 44px;
  padding: 6px 10px;
  border-radius: 12px;
  background: var(--todo-surface-soft, #f7fbfb);
  color: var(--todo-text-secondary, #607086);
  font-weight: 700;
  text-align: center;
}

.task-content {
  min-width: 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--todo-text, #162033);
}

.task-item.completed .task-content {
  color: var(--todo-text-secondary, #607086);
  text-decoration: none;
}

.task-points {
  flex-shrink: 0;
  margin-left: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 700;
}

.task-encouragement {
  top: 14px;
  right: 16px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(47, 180, 121, 0.12);
  color: #228b5d;
  font-weight: 600;
  animation: encouragement-fade 0.35s ease;
}

@keyframes encouragement-fade {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .content-section {
    padding: 22px 18px;
    border-radius: 24px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .task-item {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
  }

  .task-progress {
    width: 100%;
    justify-content: space-between;
  }

  .task-encouragement {
    position: static;
    order: 4;
  }
}
</style>
