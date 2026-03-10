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
      <div class="view-toolbar">
        <el-button circle size="small" @click="shiftDay(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-date-picker
          :model-value="selectedDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          size="small"
          class="view-picker"
          @update:model-value="$emit('date-change', $event)"
        />
        <el-button circle size="small" @click="shiftDay(1)">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button size="small" @click="$emit('date-change', today)">今天</el-button>
        <div class="view-stats">
          <span class="stat-item">共 {{ viewSummary.taskTotal }} 个任务</span>
          <span class="stat-divider">|</span>
          <span class="stat-item completed">已完成 {{ viewSummary.completedTotal }}</span>
        </div>
      </div>

      <div v-loading="loading" class="day-schedule">
        <template v-if="daySchedule.length > 0">
          <div
            v-for="hour in daySchedule"
            :key="hour.time"
            class="hour-slot"
            :class="{ 'has-tasks': hour.tasks && hour.tasks.length > 0 }"
          >
            <div class="time-label">{{ hour.time }}</div>
            <div class="hour-content">
              <div
                v-for="task in hour.tasks"
                :key="task.id"
                class="scheduled-task"
                :class="[task.type || task.taskType, { 'is-completed': task.status === 1 }]"
              >
                <span class="task-text">{{ task.content }}</span>
                <el-tag
                  :type="getTaskTypeColor(task.type || task.taskType)"
                  size="small"
                  effect="light"
                  round
                  class="task-type-tag"
                >
                  {{ getTaskTypeLabel(task.type || task.taskType) }}
                </el-tag>
                <span
                  v-if="task.targetCount > 1"
                  class="task-progress"
                >
                  {{ task.completedCount }}/{{ task.targetCount }}
                </span>
              </div>
              <div v-if="!hour.tasks || hour.tasks.length === 0" class="empty-slot">—</div>
            </div>
          </div>
        </template>
        <el-empty v-else description="当天暂无任务" :image-size="80" />
      </div>
    </div>

    <!-- 周视图 -->
    <div v-if="activeView === 'week'" class="week-view">
      <div class="view-toolbar">
        <el-button circle size="small" @click="shiftWeek(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="week-picker-group">
          <el-input-number
            :model-value="selectedYear"
            :min="2020"
            :max="2099"
            size="small"
            controls-position="right"
            class="year-picker"
            @update:model-value="handleYearChange"
          />
          <span class="picker-label">年 第</span>
          <el-input-number
            :model-value="selectedWeek"
            :min="1"
            :max="53"
            size="small"
            controls-position="right"
            class="week-num-picker"
            @update:model-value="handleWeekChange"
          />
          <span class="picker-label">周</span>
        </div>
        <el-button circle size="small" @click="shiftWeek(1)">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button size="small" @click="goCurrentWeek">本周</el-button>
        <div class="view-stats">
          <span v-if="viewSummary.dateRange" class="stat-item range">{{ viewSummary.dateRange }}</span>
          <span class="stat-divider">|</span>
          <span class="stat-item">共 {{ viewSummary.taskTotal }} 个任务</span>
          <span class="stat-divider">|</span>
          <span class="stat-item completed">已完成 {{ viewSummary.completedTotal }}</span>
        </div>
      </div>

      <div v-loading="loading" class="week-grid">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="week-day"
          :class="{ 'is-today': day.date === today }"
          @click="$emit('view-change', 'day'); $emit('date-change', day.date)"
        >
          <div class="day-header">{{ day.label }}</div>
          <div class="day-date">{{ day.date ? day.date.slice(5) : '' }}</div>
          <div class="day-tasks-count">
            <span class="count-num">{{ day.taskCount }}</span>
            <span class="count-label">个任务</span>
          </div>
          <div v-if="day.completedCount > 0" class="day-completed">
            已完成 {{ day.completedCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="activeView === 'month'" class="month-view">
      <div class="view-toolbar">
        <el-button circle size="small" @click="shiftMonth(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="month-picker-group">
          <el-input-number
            :model-value="selectedYear"
            :min="2020"
            :max="2099"
            size="small"
            controls-position="right"
            class="year-picker"
            @update:model-value="handleYearChangeForMonth"
          />
          <span class="picker-label">年</span>
          <el-input-number
            :model-value="selectedMonth"
            :min="1"
            :max="12"
            size="small"
            controls-position="right"
            class="month-num-picker"
            @update:model-value="handleMonthChange"
          />
          <span class="picker-label">月</span>
        </div>
        <el-button circle size="small" @click="shiftMonth(1)">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button size="small" @click="goCurrentMonth">本月</el-button>
        <div class="view-stats">
          <span class="stat-item">共 {{ viewSummary.taskTotal }} 个任务</span>
          <span class="stat-divider">|</span>
          <span class="stat-item completed">已完成 {{ viewSummary.completedTotal }}</span>
        </div>
      </div>

      <div v-loading="loading" class="month-calendar">
        <div class="calendar-header">
          <div v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="day-name">
            {{ day }}
          </div>
        </div>
        <div class="calendar-body">
          <!-- 月初偏移占位 -->
          <div
            v-for="n in firstDayOffset"
            :key="'offset-' + n"
            class="calendar-date empty"
          />
          <div
            v-for="date in monthDates"
            :key="date.date"
            class="calendar-date"
            :class="{
              'has-tasks': date.taskCount > 0,
              'is-today': date.date === today
            }"
            @click="$emit('view-change', 'day'); $emit('date-change', date.date)"
          >
            <div class="date-number">{{ date.day }}</div>
            <div v-if="date.taskCount > 0" class="date-tasks">
              {{ date.taskCount }} 个任务
            </div>
            <div v-if="date.completedCount > 0" class="date-completed">
              ✓ {{ date.completedCount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useTaskUtils } from '@/composables/useTaskUtils'

interface ViewSummary {
  weekLabel?: string
  dateRange?: string
  monthLabel?: string
  taskTotal: number
  completedTotal: number
}

interface HourSlot {
  time: string
  tasks: any[]
}

interface WeekDay {
  date: string
  label: string
  taskCount: number
  completedCount?: number
  tasks?: any[]
}

interface MonthDate {
  date: string
  day: number
  taskCount: number
  completedCount?: number
  weekDay?: string
}

const props = defineProps<{
  activeView: 'day' | 'week' | 'month'
  daySchedule: HourSlot[]
  weekDays: WeekDay[]
  monthDates: MonthDate[]
  selectedDate: string
  selectedYear: number
  selectedWeek: number
  selectedMonth: number
  viewSummary: ViewSummary
  loading: boolean
}>()

const emit = defineEmits<{
  'view-change': [viewKey: string]
  'date-change': [date: string]
  'year-change': [year: number]
  'week-change': [week: number]
  'month-change': [month: number]
}>()

const { getTaskTypeColor, getTaskTypeLabel } = useTaskUtils()

const viewTypes = [
  { key: 'day', label: '日视图' },
  { key: 'week', label: '周视图' },
  { key: 'month', label: '月视图' }
]

const today = new Date().toISOString().split('T')[0]

// 日视图切换天
const shiftDay = (offset: number) => {
  const d = new Date(props.selectedDate)
  d.setDate(d.getDate() + offset)
  emit('date-change', d.toISOString().split('T')[0])
}

// 周视图切换周
const shiftWeek = (offset: number) => {
  let week = props.selectedWeek + offset
  let year = props.selectedYear
  if (week < 1) {
    year--
    week = 52
  } else if (week > 52) {
    year++
    week = 1
  }
  emit('year-change', year)
  emit('week-change', week)
}

const handleYearChange = (val: number) => {
  emit('year-change', val)
  emit('week-change', props.selectedWeek)
}

const handleWeekChange = (val: number) => {
  emit('week-change', val)
}

const goCurrentWeek = () => {
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  emit('year-change', now.getFullYear())
  emit('week-change', week)
}

// 月视图切换月
const shiftMonth = (offset: number) => {
  let month = props.selectedMonth + offset
  let year = props.selectedYear
  if (month < 1) {
    year--
    month = 12
  } else if (month > 12) {
    year++
    month = 1
  }
  emit('year-change', year)
  emit('month-change', month)
}

const handleYearChangeForMonth = (val: number) => {
  emit('year-change', val)
  emit('month-change', props.selectedMonth)
}

const handleMonthChange = (val: number) => {
  emit('month-change', val)
}

const goCurrentMonth = () => {
  const now = new Date()
  emit('year-change', now.getFullYear())
  emit('month-change', now.getMonth() + 1)
}

// 月视图 - 计算月初偏移（周一起始）
const firstDayOffset = computed(() => {
  const firstDay = new Date(props.selectedYear, props.selectedMonth - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})
</script>

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--todo-text, #162033);
  margin: 0;
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

/* 工具栏 */
.view-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.view-picker {
  width: 160px;
}

.week-picker-group,
.month-picker-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.picker-label {
  font-size: 14px;
  color: var(--todo-text-secondary, #607086);
  font-weight: 600;
  white-space: nowrap;
}

.year-picker {
  width: 110px;
}

.week-num-picker,
.month-num-picker {
  width: 90px;
}

.view-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-size: 13px;
  color: var(--todo-text-tertiary, #94a3b8);
}

.stat-item {
  white-space: nowrap;
}

.stat-item.completed {
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 600;
}

.stat-item.range {
  color: var(--todo-text-secondary, #607086);
  font-weight: 600;
}

.stat-divider {
  color: rgba(183, 205, 214, 0.65);
}

/* 日视图 */
.day-view,
.week-view,
.month-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  flex: 1;
}

.day-schedule {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(247, 251, 251, 0.86), rgba(255, 255, 255, 0.92));
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.hour-slot {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  min-height: 52px;
  padding: 12px 14px 12px 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(228, 235, 241, 0.96);
  transition: all 0.2s;
}

.hour-slot.has-tasks {
  box-shadow: 0 8px 22px rgba(148, 163, 184, 0.12);
  border-color: rgba(137, 216, 208, 0.38);
}

.time-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--todo-text-secondary, #607086);
  align-self: center;
}

.hour-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.scheduled-task {
  display: flex;
  align-items: center;
  gap: 8px;
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

.scheduled-task.other {
  background: rgba(148, 163, 184, 0.12);
  color: #607086;
}

.scheduled-task.is-completed {
  background: rgba(148, 163, 184, 0.08);
  color: #b0b8c8;
  text-decoration: line-through;
  opacity: 0.7;
}

.scheduled-task.is-completed .task-type-tag {
  opacity: 0.5;
}

.scheduled-task.is-completed .task-progress {
  opacity: 0.5;
}

.task-type-tag {
  border: none;
  font-size: 11px;
}

.task-progress {
  font-size: 12px;
  color: var(--todo-text-tertiary, #94a3b8);
  font-weight: 500;
}

.empty-slot {
  color: rgba(183, 205, 214, 0.5);
  font-size: 14px;
  align-self: center;
}

/* 周视图 */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
  flex: 1;
}

.week-day {
  padding: 18px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafdfd 100%);
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.12);
  text-align: center;
  cursor: pointer;
  transition: all 0.22s;
}

.week-day:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(148, 163, 184, 0.18);
  border-color: rgba(137, 216, 208, 0.48);
}

.week-day.is-today {
  border-color: var(--todo-accent, #3dc7bc);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 251, 249, 0.98));
}

.day-header {
  font-weight: 600;
  color: var(--todo-text, #162033);
  margin-bottom: 4px;
}

.day-date {
  font-size: 12px;
  color: var(--todo-text-tertiary, #94a3b8);
  margin-bottom: 10px;
}

.day-tasks-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--todo-accent-soft, rgba(61, 199, 188, 0.12));
  color: var(--todo-accent-strong, #1b9c94);
  font-size: 13px;
  font-weight: 600;
}

.count-num {
  font-size: 16px;
}

.count-label {
  font-size: 12px;
}

.day-completed {
  margin-top: 6px;
  font-size: 12px;
  color: var(--todo-accent-strong, #1b9c94);
}

/* 月视图 */
.month-calendar {
  padding: 10px;
  background: linear-gradient(180deg, rgba(247, 251, 251, 0.86), rgba(255, 255, 255, 0.92));
  border-radius: 24px;
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.calendar-header {
  display: grid;
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
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.calendar-date {
  min-height: 90px;
  padding: 10px;
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(148, 163, 184, 0.08);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-date.empty {
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: default;
}

.calendar-date:not(.empty):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.14);
  border-color: rgba(137, 216, 208, 0.42);
}

.calendar-date.has-tasks {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 251, 249, 0.98));
  border-color: rgba(137, 216, 208, 0.48);
}

.calendar-date.is-today {
  border-color: var(--todo-accent, #3dc7bc);
  border-width: 2px;
}

.date-number {
  font-weight: 600;
  color: var(--todo-text, #162033);
  font-size: 14px;
}

.date-tasks {
  margin-top: auto;
  font-size: 12px;
  line-height: 1.4;
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 600;
}

.date-completed {
  font-size: 11px;
  color: var(--todo-accent, #3dc7bc);
}

/* 响应式 */
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

  .view-toolbar {
    flex-wrap: wrap;
  }

  .view-stats {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }

  .week-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .month-calendar {
    overflow-x: auto;
  }

  .calendar-header,
  .calendar-body {
    min-width: 620px;
  }
}
</style>
