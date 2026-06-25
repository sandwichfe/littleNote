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
          :shortcuts="dateShortcuts"
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
                <span v-if="task.targetCount > 1" class="task-progress">
                  {{ task.completedCount }}/{{ task.targetCount }}
                </span>
              </div>
              <div v-if="!hour.tasks || hour.tasks.length === 0" class="empty-slot">-</div>
            </div>
          </div>
        </template>
        <el-empty v-else description="当天暂无任务" :image-size="80" />
      </div>
    </div>

    <div v-if="activeView === 'week'" class="week-view">
      <div class="view-toolbar">
        <el-button circle size="small" @click="shiftWeek(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="week-picker-group">
          <el-input-number
            :model-value="selectedYear"
            :min="2020"
            :max="9999"
            size="small"
            controls-position="right"
            class="year-picker"
            @update:model-value="handleYearChange"
          />
          <span class="picker-label">年</span>
          <el-input-number
            :model-value="selectedWeek"
            :min="1"
            :max="999"
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

      <div v-loading="loading" class="week-board">
        <div class="week-grid-header">
          <div class="week-corner">
            <span class="week-title">{{ viewSummary.weekLabel || `${selectedYear} 年第 ${selectedWeek} 周` }}</span>
            <span class="week-subtitle">按时间查看本周任务</span>
          </div>
          <button
            v-for="day in weekDays"
            :key="day.date"
            type="button"
            class="week-day-header"
            :class="{ 'is-today': day.date === today }"
            @click="openDayDetail(day.date)"
          >
            <span class="week-day-label">{{ day.label }}</span>
            <span class="week-day-date">{{ formatHeaderDate(day.date) }}</span>
            <span class="week-day-meta">{{ day.taskCount }} 项</span>
          </button>
        </div>

        <div v-if="weekDays.length > 0" class="week-grid-body">
          <div class="time-column">
            <div class="all-day-label">全天</div>
            <div
              v-for="hour in weekHours"
              :key="hour"
              class="time-axis-label"
            >
              {{ formatHourLabel(hour) }}
            </div>
          </div>

          <div class="week-day-columns">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="week-day-column"
              :class="{ 'is-today': day.date === today }"
            >
              <div class="all-day-cell" @click="openDayDetail(day.date)">
                <template v-if="getAllDayTasks(day).length">
                  <div
                    v-for="task in getAllDayTasks(day)"
                    :key="task.id"
                    class="week-task-chip all-day-chip"
                    :class="[task.type || task.taskType, { 'is-completed': task.status === 1 }]"
                  >
                    <span class="task-chip-title">{{ task.content }}</span>
                    <span class="task-chip-meta">全天</span>
                  </div>
                </template>
                <div v-else class="all-day-placeholder">无全天任务</div>
              </div>

              <div
                v-for="hour in weekHours"
                :key="`${day.date}-${hour}`"
                class="time-cell"
                @click="openDayDetail(day.date)"
              >
                <div class="time-cell-track" />
                <template v-if="getTasksForHour(day, hour).length">
                  <div
                    v-for="task in getTasksForHour(day, hour)"
                    :key="task.id"
                    class="week-task-chip"
                    :class="[task.type || task.taskType, { 'is-completed': task.status === 1 }]"
                  >
                    <div class="task-chip-top">
                      <span class="task-chip-title">{{ task.content }}</span>
                      <span class="task-chip-time">{{ getTaskTimeLabel(task) }}</span>
                    </div>
                    <div class="task-chip-bottom">
                      <span>{{ getTaskTypeLabel(task.type || task.taskType) }}</span>
                      <span v-if="task.targetCount > 1">{{ task.completedCount }}/{{ task.targetCount }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="本周暂无任务" :image-size="80" />
      </div>
    </div>

    <div v-if="activeView === 'month'" class="month-view">
      <div class="view-toolbar">
        <el-button circle size="small" @click="shiftMonth(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="month-picker-group">
          <el-input-number
            :model-value="selectedYear"
            :min="2020"
            :max="9999"
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
          <span v-if="viewSummary.monthLabel" class="stat-item range">{{ viewSummary.monthLabel }}</span>
          <span class="stat-divider">|</span>
          <span class="stat-item">共 {{ viewSummary.taskTotal }} 个任务</span>
          <span class="stat-divider">|</span>
          <span class="stat-item completed">已完成 {{ viewSummary.completedTotal }}</span>
        </div>
      </div>

      <div v-loading="loading" class="month-calendar">
        <div class="calendar-header">
          <div v-for="day in monthWeekLabels" :key="day" class="day-name">
            {{ day }}
          </div>
        </div>

        <div class="calendar-body">
          <div
            v-for="cell in monthCalendarCells"
            :key="cell.key"
            class="calendar-date"
            :class="{
              empty: cell.empty,
              'has-tasks': !cell.empty && (cell.taskCount || 0) > 0,
              'is-today': !cell.empty && cell.date === today
            }"
            @click="!cell.empty && openDayDetail(cell.date)"
          >
            <template v-if="!cell.empty">
              <div class="calendar-date-head">
                <span class="date-number">{{ cell.day }}</span>
                <span v-if="cell.completedCount" class="date-completed">已完成 {{ cell.completedCount }}</span>
              </div>

              <div v-if="cell.tasks && cell.tasks.length" class="month-task-list">
                <div
                  v-for="task in getMonthPreviewTasks(cell)"
                  :key="task.id"
                  class="month-task-pill"
                  :class="[task.type || task.taskType, { 'is-completed': task.status === 1 }]"
                >
                  <span class="month-task-time">{{ getTaskTimeLabel(task, true) }}</span>
                  <span class="month-task-title">{{ task.content }}</span>
                </div>
                <div v-if="cell.tasks.length > monthPreviewLimit" class="month-more">
                  +{{ cell.tasks.length - monthPreviewLimit }} 项
                </div>
              </div>

              <div v-else class="month-empty-state">
                <span>暂无任务</span>
              </div>
            </template>
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

interface TaskItem {
  id: number | string
  content: string
  deadline?: string
  status?: number
  taskType?: string
  type?: string
  targetCount?: number
  completedCount?: number
}

interface HourSlot {
  time: string
  tasks: TaskItem[]
}

interface WeekDay {
  date: string
  label: string
  taskCount: number
  completedCount?: number
  tasks?: TaskItem[]
}

interface MonthDate {
  date: string
  day: number
  taskCount: number
  completedCount?: number
  weekDay?: string
  tasks?: TaskItem[]
}

interface EmptyMonthCell {
  key: string
  empty: true
}

type MonthCalendarCell = (MonthDate & { key: string; empty?: false }) | EmptyMonthCell

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

const dateShortcuts = [
  {
    text: '今天',
    value: new Date(),
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24)
      return date
    },
  },
  {
    text: '明天',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() + 3600 * 1000 * 24)
      return date
    },
  },
]

const viewTypes = [
  { key: 'day', label: '日视图' },
  { key: 'week', label: '周视图' },
  { key: 'month', label: '月视图' }
]

const monthWeekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const monthPreviewLimit = 3
const weekStartHour = 6
const weekEndHour = 22

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

const today = formatLocalDate(new Date())

const weekHours = computed(() =>
  Array.from({ length: weekEndHour - weekStartHour + 1 }, (_, index) => weekStartHour + index)
)

const firstDayOffset = computed(() => {
  const firstDay = new Date(props.selectedYear, props.selectedMonth - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})

const monthCalendarCells = computed<MonthCalendarCell[]>(() => {
  const leading: EmptyMonthCell[] = Array.from({ length: firstDayOffset.value }, (_, index) => ({
    key: `leading-${index}`,
    empty: true
  }))

  const dates = props.monthDates.map((date) => ({
    ...date,
    key: date.date,
    empty: false as const
  }))

  const totalCells = leading.length + dates.length
  const trailingCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const trailing: EmptyMonthCell[] = Array.from({ length: trailingCount }, (_, index) => ({
    key: `trailing-${index}`,
    empty: true
  }))

  return [...leading, ...dates, ...trailing]
})

const shiftDay = (offset: number) => {
  const d = parseLocalDate(props.selectedDate)
  d.setDate(d.getDate() + offset)
  emit('date-change', formatLocalDate(d))
}

const shiftWeek = (offset: number) => {
  let week = props.selectedWeek + offset
  let year = props.selectedYear
  if (week < 1) {
    year -= 1
    week = 52
  } else if (week > 52) {
    year += 1
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

const shiftMonth = (offset: number) => {
  let month = props.selectedMonth + offset
  let year = props.selectedYear
  if (month < 1) {
    year -= 1
    month = 12
  } else if (month > 12) {
    year += 1
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

const openDayDetail = (date: string) => {
  emit('view-change', 'day')
  emit('date-change', date)
}

const parseTaskDate = (task: TaskItem) => {
  if (!task.deadline) {
    return null
  }

  const normalized = task.deadline.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const sortTasksByTime = (tasks?: TaskItem[]) => {
  return [...(tasks || [])].sort((a, b) => {
    const aDate = parseTaskDate(a)
    const bDate = parseTaskDate(b)

    if (!aDate && !bDate) {
      return String(a.content || '').localeCompare(String(b.content || ''))
    }
    if (!aDate) {
      return -1
    }
    if (!bDate) {
      return 1
    }
    return aDate.getTime() - bDate.getTime()
  })
}

const getAllDayTasks = (day: WeekDay) => {
  return sortTasksByTime(day.tasks).filter((task) => !parseTaskDate(task)).slice(0, 2)
}

const getTasksForHour = (day: WeekDay, hour: number) => {
  return sortTasksByTime(day.tasks).filter((task) => {
    const date = parseTaskDate(task)
    return date ? date.getHours() === hour : false
  })
}

const formatHourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`

const formatHeaderDate = (dateString: string) => {
  const date = parseLocalDate(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

const getTaskTimeLabel = (task: TaskItem, compact = false) => {
  const date = parseTaskDate(task)
  if (!date) {
    return compact ? '全天' : '未设时间'
  }

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  if (compact && mm === '00') {
    return `${hh}:00`
  }
  return `${hh}:${mm}`
}

const getMonthPreviewTasks = (date: MonthDate) => sortTasksByTime(date.tasks).slice(0, monthPreviewLimit)
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
  margin: 0;
  font-size: 28px;
  font-weight: 700;
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

.day-view,
.week-view,
.month-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
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

.scheduled-task,
.week-task-chip,
.month-task-pill {
  color: #607086;
  background: rgba(244, 248, 251, 0.9);
}

.scheduled-task,
.week-task-chip {
  border-radius: 12px;
}

.scheduled-task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 600;
}

.scheduled-task.work,
.week-task-chip.work,
.month-task-pill.work {
  background: rgba(96, 165, 250, 0.18);
  color: #1d4ed8;
}

.scheduled-task.study,
.week-task-chip.study,
.month-task-pill.study {
  background: rgba(47, 180, 121, 0.18);
  color: #1f7a53;
}

.scheduled-task.health,
.week-task-chip.health,
.month-task-pill.health {
  background: rgba(245, 158, 11, 0.2);
  color: #a16207;
}

.scheduled-task.other,
.week-task-chip.other,
.month-task-pill.other {
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
}

.scheduled-task.is-completed,
.week-task-chip.is-completed,
.month-task-pill.is-completed {
  opacity: 0.62;
}

.scheduled-task.is-completed {
  text-decoration: line-through;
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

.week-board,
.month-calendar {
  padding: 14px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(247, 251, 251, 0.86), rgba(255, 255, 255, 0.92));
  border: 1px solid var(--todo-border, rgba(208, 220, 228, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.week-grid-header {
  display: grid;
  grid-template-columns: 90px repeat(7, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
  min-width: 1180px;
}

.week-corner,
.week-day-header {
  min-height: 84px;
  padding: 14px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(228, 235, 241, 0.96);
}

.week-corner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.week-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--todo-text, #162033);
}

.week-subtitle {
  font-size: 12px;
  color: var(--todo-text-tertiary, #94a3b8);
}

.week-day-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.week-day-header:hover {
  border-color: rgba(137, 216, 208, 0.54);
  box-shadow: 0 12px 28px rgba(148, 163, 184, 0.14);
  transform: translateY(-1px);
}

.week-day-header.is-today {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 251, 249, 0.98));
  border-color: var(--todo-accent, #3dc7bc);
}

.week-day-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--todo-text, #162033);
}

.week-day-date {
  font-size: 22px;
  font-weight: 700;
  color: #243042;
}

.week-day-meta {
  font-size: 12px;
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 600;
}

.week-grid-body {
  display: grid;
  grid-template-columns: 90px minmax(1090px, 1fr);
  gap: 10px;
  min-width: 1180px;
}

.time-column {
  display: grid;
  grid-template-rows: 72px repeat(17, 88px);
  gap: 10px;
}

.all-day-label,
.time-axis-label {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--todo-text-tertiary, #94a3b8);
}

.week-day-columns {
  display: grid;
  grid-template-columns: repeat(7, minmax(150px, 1fr));
  gap: 10px;
}

.week-day-column {
  display: grid;
  grid-template-rows: 72px repeat(17, 88px);
  gap: 10px;
}

.all-day-cell,
.time-cell {
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(228, 235, 241, 0.96);
  background: rgba(255, 255, 255, 0.94);
  padding: 8px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.all-day-cell:hover,
.time-cell:hover {
  border-color: rgba(137, 216, 208, 0.54);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.12);
}

.week-day-column.is-today .all-day-cell,
.week-day-column.is-today .time-cell {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 252, 250, 0.96));
}

.all-day-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.all-day-placeholder {
  margin: auto 0;
  text-align: center;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.8);
}

.time-cell {
  overflow-y: auto;
}

.time-cell-track {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 18px;
  height: 1px;
  background: rgba(226, 232, 240, 0.8);
}

.week-task-chip {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  margin-bottom: 8px;
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.1);
}

.week-task-chip:last-child {
  margin-bottom: 0;
}

.all-day-chip {
  min-height: auto;
}

.task-chip-top,
.task-chip-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.task-chip-title {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
}

.task-chip-time,
.task-chip-meta,
.task-chip-bottom {
  font-size: 11px;
  color: inherit;
}

.task-chip-bottom {
  opacity: 0.78;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
  min-width: 980px;
}

.day-name {
  padding: 12px 8px;
  text-align: center;
  font-weight: 700;
  color: var(--todo-text-secondary, #607086);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 14px;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  min-width: 980px;
}

.calendar-date {
  min-height: 148px;
  padding: 10px;
  border: 1px solid rgba(228, 235, 241, 0.96);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 6px 16px rgba(148, 163, 184, 0.08);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-date.empty {
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: default;
}

.calendar-date:not(.empty):hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(148, 163, 184, 0.14);
  border-color: rgba(137, 216, 208, 0.42);
}

.calendar-date.has-tasks {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 252, 250, 0.96));
}

.calendar-date.is-today {
  border-color: var(--todo-accent, #3dc7bc);
  border-width: 2px;
}

.calendar-date-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.date-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--todo-text, #162033);
}

.date-completed {
  font-size: 11px;
  color: var(--todo-accent-strong, #1b9c94);
  font-weight: 600;
}

.month-task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.month-task-pill {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.month-task-time {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.82;
}

.month-task-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-more {
  margin-top: 2px;
  font-size: 11px;
  color: var(--todo-text-tertiary, #94a3b8);
  font-weight: 600;
}

.month-empty-state {
  margin-top: auto;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.8);
}

@media (max-width: 1024px) {
  .content-section {
    padding: 22px 20px;
    border-radius: 24px;
  }
}

@media (max-width: 768px) {
  .content-section {
    padding: 20px 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .view-buttons {
    width: 100%;
  }

  .view-buttons :deep(.el-button) {
    flex: 1;
  }

  .view-stats {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .week-board,
  .month-calendar {
    padding: 10px;
  }

  .week-grid-header,
  .week-grid-body,
  .calendar-header,
  .calendar-body {
    min-width: 980px;
  }
}
</style>
