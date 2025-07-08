<template>
  <div class="content-section">
    <div class="section-header">
      <h2 class="section-title">任务视图</h2>
      <div class="view-buttons">
        <el-button 
          v-for="view in viewTypes" 
          :key="view.key"
          :type="activeView === view.key ? 'primary' : 'default'"
          size="small"
          @click="$emit('view-change', view.key)"
        >
          {{ view.label }}
        </el-button>
      </div>
    </div>
    
    <!-- 日视图 -->
    <div v-if="activeView === 'day'" class="day-view">
      <h3 class="view-title">{{ currentDate }}</h3>
      <div class="day-schedule">
        <div 
          v-for="hour in daySchedule" 
          :key="hour.time"
          class="hour-slot"
        >
          <div class="time-label">{{ hour.time }}</div>
          <div class="hour-content">
            <div 
              v-for="task in hour.tasks" 
              :key="task.id"
              class="scheduled-task"
              :class="task.type"
            >
              {{ task.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 周视图 -->
    <div v-if="activeView === 'week'" class="week-view">
      <h3 class="view-title">{{ currentWeek }}</h3>
      <div class="week-grid">
        <div 
          v-for="day in weekDays" 
          :key="day.date"
          class="week-day"
        >
          <div class="day-header">{{ day.label }}</div>
          <div class="day-tasks">{{ day.taskCount }}个任务</div>
        </div>
      </div>
    </div>
    
    <!-- 月视图 -->
    <div v-if="activeView === 'month'" class="month-view">
      <h3 class="view-title">{{ currentMonth }}</h3>
      <div class="month-calendar">
        <div class="calendar-header">
          <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="day-name">
            {{ day }}
          </div>
        </div>
        <div class="calendar-body">
          <div 
            v-for="date in monthDates" 
            :key="date.date"
            class="calendar-date"
            :class="{ 'has-tasks': date.taskCount > 0 }"
          >
            <div class="date-number">{{ date.day }}</div>
            <div v-if="date.taskCount > 0" class="date-tasks">
              {{ date.taskCount }}个任务
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskUtils } from '@/composables/useTaskUtils'

// Props
const props = defineProps({
  activeView: {
    type: String,
    default: 'day'
  },
  daySchedule: {
    type: Array,
    default: () => []
  },
  weekDays: {
    type: Array,
    default: () => []
  },
  monthDates: {
    type: Array,
    default: () => []
  }
})

// Emits
defineEmits(['view-change'])

// 使用工具函数
const { getCurrentDateString } = useTaskUtils()

// 视图类型
const viewTypes = [
  { key: 'day', label: '日视图' },
  { key: 'week', label: '周视图' },
  { key: 'month', label: '月视图' }
]

// 当前日期
const currentDate = computed(() => getCurrentDateString())

// 当前周
const currentWeek = computed(() => {
  return '2025年第1周'
})

// 当前月
const currentMonth = computed(() => {
  return '2025年1月'
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

.view-buttons {
  display: flex;
  gap: 8px;
}

.day-view,
.week-view,
.month-view {
  margin-top: 24px;
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.day-schedule {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hour-slot {
  display: flex;
  align-items: center;
  min-height: 60px;
  border-bottom: 1px solid #f0f0f0;
}

.time-label {
  width: 80px;
  font-size: 14px;
  color: #666;
  text-align: right;
  padding-right: 16px;
}

.hour-content {
  flex: 1;
  padding-left: 16px;
}

.scheduled-task {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 4px;
}

.scheduled-task.work {
  background: #e3f2fd;
  color: #1976d2;
}

.scheduled-task.study {
  background: #e8f5e8;
  color: #388e3c;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.week-day {
  padding: 16px;
  background: #fce4ec;
  border-radius: 8px;
  text-align: center;
}

.day-header {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.day-tasks {
  color: #8e6ff7;
  font-size: 14px;
}

.month-calendar {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f5f5;
}

.day-name {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-date {
  min-height: 80px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.calendar-date.has-tasks {
  background: #fce4ec;
}

.date-number {
  font-weight: 600;
  color: #333;
}

.date-tasks {
  margin-top: 4px;
  font-size: 12px;
  color: #8e6ff7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .week-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>