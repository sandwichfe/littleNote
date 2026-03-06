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

<script setup lang="ts">
import { computed } from 'vue'
import { useTaskUtils } from '@/composables/useTaskUtils'
import type { Task } from '@/network/todo'

// 定义视图相关的类型
interface HourSlot {
  time: string
  tasks: Task[]
}

interface WeekDay {
  date: string
  label: string
  taskCount: number
}

interface MonthDate {
  date: string
  day: number
  taskCount: number
}

// Props
const props = defineProps<{
  activeView: 'day' | 'week' | 'month'
  daySchedule: HourSlot[]
  weekDays: WeekDay[]
  monthDates: MonthDate[]
}>()

// Emits
defineEmits<{
  'view-change': [viewKey: string]
}>()

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
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 28px;
  color: var(--todo-text, #162033);
}

.view-buttons {
  display: inline-flex;
  gap: 0;
  padding: 5px;
  background: var(--todo-surface-soft, #f7fbfb);
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.view-buttons :deep(.el-button) {
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 14px !important;
  background: transparent;
  color: var(--todo-text-secondary, #607086);
  font-weight: 600;
}

.view-buttons :deep(.el-button--primary) {
  background: #ffffff;
  color: var(--todo-accent-strong, #1b9c94);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.14);
}

.day-view,
.week-view,
.month-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  margin-top: 0;
}

.view-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--todo-text, #162033);
}

.day-schedule {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(247, 251, 251, 0.86), rgba(255, 255, 255, 0.92));
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.hour-slot {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  min-height: 72px;
  padding: 14px 14px 14px 16px;
  border-bottom: none;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(228, 235, 241, 0.96);
  box-shadow: 0 8px 22px rgba(148, 163, 184, 0.12);
}

.time-label {
  width: auto;
  padding-right: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--todo-text-secondary, #607086);
  text-align: left;
  align-self: center;
}

.hour-content {
  padding-left: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.scheduled-task {
  margin-bottom: 0;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 600;
  background: rgba(244, 248, 251, 0.9);
  color: var(--todo-text-secondary, #607086);
}

.scheduled-task.work {
  background: rgba(96, 165, 250, 0.12);
  color: #2563eb;
}

.scheduled-task.study {
  background: rgba(47, 180, 121, 0.12);
  color: #20895b;
}

.scheduled-task.health {
  background: rgba(245, 158, 11, 0.14);
  color: #b7791f;
}

.week-grid {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
}

.week-day {
  padding: 18px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafdfd 100%);
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.12);
}

.day-header {
  margin-bottom: 10px;
  color: var(--todo-text, #162033);
}

.day-tasks {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
  color: var(--todo-accent-strong, #1b9c94);
  font-size: 13px;
  font-weight: 600;
}

.month-calendar {
  padding: 10px;
  background: linear-gradient(180deg, rgba(247, 251, 251, 0.86), rgba(255, 255, 255, 0.92));
  border-radius: 24px;
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.calendar-header,
.calendar-body {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.day-name {
  padding: 12px 8px;
  text-align: center;
  font-weight: 700;
  color: var(--todo-text-secondary, #607086);
  background: #ffffff;
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 14px;
}

.calendar-body {
  margin-top: 8px;
}

.calendar-date {
  min-height: 104px;
  padding: 12px;
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.1);
  gap: 8px;
}

.calendar-date.has-tasks {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 251, 249, 0.98));
  border-color: rgba(137, 216, 208, 0.48);
}

.date-number {
  color: var(--todo-text, #162033);
}

.date-tasks {
  margin-top: auto;
  line-height: 1.4;
  color: var(--todo-accent-strong, #1b9c94);
}

@media (max-width: 1024px) {
  .week-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
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

  .view-buttons {
    width: 100%;
  }

  .view-buttons :deep(.el-button) {
    flex: 1;
  }

  .hour-slot {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .week-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .month-calendar {
    overflow-x: auto;
  }

  .calendar-header,
  .calendar-body {
    min-width: 720px;
  }
}
</style>
