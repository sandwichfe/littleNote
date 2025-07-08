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

<script setup>
import { computed } from 'vue'
import { useTaskUtils } from '@/composables/useTaskUtils'

// Props
const props = defineProps({
  dailyTasks: {
    type: Array,
    default: () => []
  }
})

// Emits
defineEmits(['increment-task'])

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