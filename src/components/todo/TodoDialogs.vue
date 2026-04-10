<template>
  <el-dialog
    v-model="showAddTaskDialog"
    title="添加新待办"
    width="500px"
    class="todo-dialog"
  >
    <el-form :model="newTask" label-width="88px" class="todo-dialog-form">
      <el-form-item label="任务名称">
        <el-input v-model="newTask.content" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="任务类型">
        <el-select v-model="newTask.type" placeholder="请选择任务类型">
          <el-option label="工作任务" value="work" />
          <el-option label="学习计划" value="study" />
          <el-option label="健康习惯" value="health" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止时间">
        <el-date-picker
          v-model="newTask.deadline"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm"
          placeholder="请选择截止时间"
          clearable
          class="full-width"
        />
      </el-form-item>
      <el-form-item label="目标次数">
        <el-input-number
          v-model="newTask.targetCount"
          :min="1"
          placeholder="需要完成的次数"
        />
        <div v-if="newTask.targetCount > 1" class="limit-toggle">
          <el-checkbox v-model="newTask.isDailyLimit" :true-label="1" :false-label="0">
            每日仅可完成一次
          </el-checkbox>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancelAddTask">取消</el-button>
      <el-button type="primary" @click="handleConfirmAddTask">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showEditTaskDialog"
    title="编辑任务"
    width="500px"
    class="todo-dialog"
  >
    <el-form :model="editTaskForm" label-width="88px" class="todo-dialog-form">
      <el-form-item label="任务名称">
        <el-input v-model="editTaskForm.content" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="任务类型">
        <el-select v-model="editTaskForm.type" placeholder="请选择任务类型">
          <el-option label="工作任务" value="work" />
          <el-option label="学习计划" value="study" />
          <el-option label="健康习惯" value="health" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止时间">
        <el-date-picker
          v-model="editTaskForm.deadline"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm"
          placeholder="请选择截止时间"
          clearable
          class="full-width"
        />
      </el-form-item>
      <el-form-item label="目标次数">
        <el-input-number
          v-model="editTaskForm.targetCount"
          :min="1"
          :max="9999"
          placeholder="需要完成的次数"
        />
        <div v-if="editTaskForm.targetCount > 1" class="limit-toggle">
          <el-checkbox v-model="editTaskForm.isDailyLimit" :true-label="1" :false-label="0">
            每日仅可完成一次
          </el-checkbox>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancelEditTask">取消</el-button>
      <el-button type="primary" @click="handleConfirmEditTask">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showViewTaskDialog"
    title="任务详情"
    width="720px"
    class="todo-dialog todo-detail-dialog"
  >
    <template v-if="viewTask">
      <div class="detail-hero">
        <div class="detail-hero-main">
          <div class="detail-title-row">
            <h3 class="detail-title">{{ viewTask.content }}</h3>
            <el-tag
              :type="viewTask.status === 1 ? 'success' : 'warning'"
              effect="light"
              round
            >
              {{ viewTask.status === 1 ? '已完成' : '进行中' }}
            </el-tag>
          </div>
          <div class="detail-meta-row">
            <el-tag
              :type="getTaskTypeColor(viewTask.type || viewTask.taskType)"
              effect="light"
              round
              class="detail-tag"
            >
              {{ getTaskTypeLabel(viewTask.type || viewTask.taskType) }}
            </el-tag>
            <span class="detail-chip">目标 {{ viewTask.targetCount }} 次</span>
            <span class="detail-chip">已完成 {{ viewTask.completedCount }} 次</span>
            <span v-if="viewTask.targetCount > 1" class="detail-chip detail-chip--accent">多次任务</span>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <span class="detail-card-label">创建时间</span>
          <strong>{{ formatDateTime(viewTask.createTime) }}</strong>
        </div>
        <div class="detail-card">
          <span class="detail-card-label">截止时间</span>
          <strong>{{ viewTask.deadline ? formatDateTime(viewTask.deadline) : '未设置' }}</strong>
        </div>
        <div class="detail-card">
          <span class="detail-card-label">最近完成</span>
          <strong>{{ viewTask.lastCompleteTime ? formatDateTime(viewTask.lastCompleteTime) : '暂无' }}</strong>
        </div>
        <div class="detail-card">
          <span class="detail-card-label">每日限制</span>
          <strong>{{ Number(viewTask.isDailyLimit) === 1 ? '每日仅一次' : '无限制' }}</strong>
        </div>
      </div>

      <div class="timeline-block">
        <div class="timeline-header">
          <div>
            <h4>历史完成记录</h4>
            <p>按完成时间倒序显示</p>
          </div>
          <span class="timeline-count">
            共 {{ completionRecords.length }} 条
          </span>
        </div>

        <el-skeleton :loading="historyLoading" animated :rows="5">
          <template #default>
            <div v-if="viewTask.targetCount <= 1" class="detail-empty">
              这是单次任务，没有多次完成历史。
            </div>

            <div v-else-if="completionRecords.length === 0" class="detail-empty">
              还没有历史完成记录。
            </div>

            <el-timeline v-else class="completion-timeline">
              <el-timeline-item
                v-for="record in completionRecords"
                :key="record.id"
                :timestamp="formatDateTime(record.completedAt)"
                placement="top"
                type="primary"
              >
                <div class="timeline-item-card">
                  <strong>第 {{ record.completedSequence }} 次完成</strong>
                  <div class="timeline-item-main">
                    <span>{{ formatFriendlyRecordTime(record.completedAt) }}</span>
                    <el-button
                      link
                      type="primary"
                      class="timeline-edit-btn"
                      @click="handleOpenEditCompletionDialog(record)"
                    >
                      编辑
                    </el-button>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </template>
        </el-skeleton>
      </div>
    </template>

    <template #footer>
      <el-button @click="showViewTaskDialog = false">关闭</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showEditCompletionDialog"
    title="编辑完成时间"
    width="480px"
    class="todo-dialog"
  >
    <el-form :model="editCompletionForm" label-width="88px" class="todo-dialog-form">
      <el-form-item label="完成时间">
        <el-date-picker
          v-model="editCompletionForm.completedAt"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm"
          placeholder="请选择完成时间"
          clearable
          class="full-width"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancelEditCompletion">取消</el-button>
      <el-button type="primary" @click="handleConfirmEditCompletion">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useTaskUtils } from '@/composables/useTaskUtils'

const props = defineProps({
  showAddTaskDialog: {
    type: Boolean,
    default: false
  },
  showAddRewardDialog: {
    type: Boolean,
    default: false
  },
  showEditTaskDialog: {
    type: Boolean,
    default: false
  },
  showViewTaskDialog: {
    type: Boolean,
    default: false
  },
  editingTask: {
    type: Object,
    default: () => ({})
  },
  viewingTask: {
    type: Object,
    default: () => null
  },
  completionRecords: {
    type: Array,
    default: () => []
  },
  historyLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:showAddTaskDialog',
  'update:showAddRewardDialog',
  'update:showEditTaskDialog',
  'update:showViewTaskDialog',
  'add-task',
  'add-reward',
  'update-task',
  'update-completion-record'
])

const { getTaskTypeColor, getTaskTypeLabel, formatDateTime } = useTaskUtils()

const showAddTaskDialog = ref(props.showAddTaskDialog)
const showAddRewardDialog = ref(props.showAddRewardDialog)
const showEditTaskDialog = ref(props.showEditTaskDialog)
const showViewTaskDialog = ref(props.showViewTaskDialog)
const showEditCompletionDialog = ref(false)

const viewTask = computed(() => props.viewingTask || null)

const createDefaultTask = () => ({
  content: '',
  type: 'work',
  deadline: '',
  targetCount: 1,
  isDailyLimit: 0
})

watch(() => props.showAddTaskDialog, (value) => {
  showAddTaskDialog.value = value
  if (value) {
    resetTaskForm()
  }
})

watch(() => props.showAddRewardDialog, (value) => {
  showAddRewardDialog.value = value
})

watch(() => props.showEditTaskDialog, (value) => {
  showEditTaskDialog.value = value
  if (value && props.editingTask) {
    editTaskForm.value = { ...props.editingTask }
  }
})

watch(() => props.showViewTaskDialog, (value) => {
  showViewTaskDialog.value = value
  if (!value) {
    showEditCompletionDialog.value = false
    resetEditCompletionForm()
  }
})

watch(showAddTaskDialog, (value) => {
  emit('update:showAddTaskDialog', value)
})

watch(showAddRewardDialog, (value) => {
  emit('update:showAddRewardDialog', value)
})

watch(showEditTaskDialog, (value) => {
  emit('update:showEditTaskDialog', value)
})

watch(showViewTaskDialog, (value) => {
  emit('update:showViewTaskDialog', value)
})

const newTask = ref(createDefaultTask())

const editTaskForm = ref({
  id: null,
  content: '',
  type: '',
  deadline: '',
  targetCount: 1,
  isDailyLimit: 0
})

const editCompletionForm = ref({
  recordId: null,
  taskId: null,
  completedAt: ''
})

const handleConfirmAddTask = () => {
  emit('add-task', { ...newTask.value })
  resetTaskForm()
}

const handleCancelAddTask = () => {
  showAddTaskDialog.value = false
  resetTaskForm()
}

const resetTaskForm = () => {
  newTask.value = createDefaultTask()
}

const handleConfirmEditTask = () => {
  emit('update-task', { ...editTaskForm.value })
  showEditTaskDialog.value = false
}

const handleCancelEditTask = () => {
  showEditTaskDialog.value = false
}

const handleOpenEditCompletionDialog = (record) => {
  if (!viewTask.value?.id || !record?.id) {
    return
  }
  editCompletionForm.value = {
    recordId: record.id,
    taskId: viewTask.value.id,
    completedAt: record.completedAt || ''
  }
  showEditCompletionDialog.value = true
}

const handleCancelEditCompletion = () => {
  showEditCompletionDialog.value = false
  resetEditCompletionForm()
}

const handleConfirmEditCompletion = () => {
  if (!editCompletionForm.value.completedAt) {
    ElMessage.warning('请选择完成时间')
    return
  }
  emit('update-completion-record', { ...editCompletionForm.value })
  showEditCompletionDialog.value = false
  resetEditCompletionForm()
}

const resetEditCompletionForm = () => {
  editCompletionForm.value = {
    recordId: null,
    taskId: null,
    completedAt: ''
  }
}

const formatFriendlyRecordTime = (time) => {
  if (!time) {
    return '暂无时间'
  }

  const target = new Date(time)
  if (Number.isNaN(target.getTime())) {
    return formatDateTime(time)
  }

  const now = Date.now()
  const diff = now - target.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))} 分钟前`
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  }

  return `${Math.floor(diff / day)} 天前`
}
</script>

<style scoped>
.todo-dialog-form {
  gap: 2px;
}

.todo-dialog-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.todo-dialog-form :deep(.el-form-item:last-child) {
  margin-bottom: 10px;
}

.todo-dialog-form :deep(.el-form-item__label) {
  color: #607086;
  font-weight: 600;
}

.todo-dialog-form :deep(.el-input),
.todo-dialog-form :deep(.el-select) {
  width: 100%;
}

.todo-dialog-form :deep(.el-input__wrapper),
.todo-dialog-form :deep(.el-select__wrapper),
.todo-dialog-form :deep(.el-textarea__inner),
.todo-dialog-form :deep(.el-input-number) {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.96),
      0 0 0 1px rgba(226, 232, 240, 0.95);
  transition: box-shadow 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
}

.todo-dialog-form :deep(.el-input__wrapper),
.todo-dialog-form :deep(.el-select__wrapper) {
  min-height: 46px;
}

.todo-dialog-form :deep(.el-input__wrapper:hover),
.todo-dialog-form :deep(.el-select__wrapper:hover),
.todo-dialog-form :deep(.el-textarea__inner:hover),
.todo-dialog-form :deep(.el-input-number:hover) {
  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.96),
      0 0 0 1px rgba(157, 224, 217, 0.98);
}

.todo-dialog-form :deep(.el-input__wrapper.is-focus),
.todo-dialog-form :deep(.is-focused.el-select__wrapper),
.todo-dialog-form :deep(.el-textarea__inner:focus),
.todo-dialog-form :deep(.el-input-number.is-focus) {
  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.96),
      0 0 0 1px rgba(61, 199, 188, 0.95),
      0 0 0 4px rgba(61, 199, 188, 0.1);
}

.todo-dialog-form :deep(.el-input__inner),
.todo-dialog-form :deep(.el-select__placeholder),
.todo-dialog-form :deep(.el-textarea__inner),
.todo-dialog-form :deep(.el-input-number .el-input__inner) {
  color: #162033;
}

.todo-dialog-form :deep(.el-input-number) {
  width: 100%;
}

.todo-dialog-form :deep(.el-input-number .el-input__wrapper) {
  box-shadow: none;
  background: transparent;
}

.todo-dialog-form :deep(.el-input-number__increase),
.todo-dialog-form :deep(.el-input-number__decrease) {
  width: 34px;
  color: #1b9c94;
  background: rgba(244, 250, 249, 0.96);
  border-left: 1px solid rgba(226, 232, 240, 0.95);
}

.limit-toggle {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: #f7fbfb;
  border: 1px solid rgba(208, 220, 228, 0.92);
}

.todo-dialog-form :deep(.el-checkbox__label) {
  color: #607086;
}

.todo-dialog-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: linear-gradient(135deg, #44c9bf 0%, #2ea79f 100%);
  border-color: #2ea79f;
}

:deep(.todo-dialog) {
  --todo-dialog-text: #162033;
  --todo-dialog-text-secondary: #607086;
  --todo-dialog-border: rgba(208, 220, 228, 0.92);
  --todo-dialog-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
}

:deep(.todo-dialog.el-dialog),
:deep(.todo-dialog .el-dialog) {
  --todo-dialog-text: #162033;
  --todo-dialog-text-secondary: #607086;
  --todo-dialog-border: rgba(208, 220, 228, 0.92);
  --todo-dialog-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);

  border-radius: 30px;
  overflow: hidden;
  border: 1px solid rgba(228, 235, 241, 0.92);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 252, 0.99));
  box-shadow: var(--todo-dialog-shadow);
}

:deep(.todo-dialog.el-dialog .el-dialog__header),
:deep(.todo-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 24px 28px 16px;
  background: linear-gradient(135deg, rgba(241, 251, 249, 0.96), rgba(250, 253, 253, 0.98));
  border-bottom: 1px solid var(--todo-dialog-border);
}

:deep(.todo-dialog.el-dialog .el-dialog__title),
:deep(.todo-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: var(--todo-dialog-text);
  letter-spacing: 0.01em;
}

:deep(.todo-dialog.el-dialog .el-dialog__headerbtn),
:deep(.todo-dialog .el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

:deep(.todo-dialog.el-dialog .el-dialog__headerbtn:hover),
:deep(.todo-dialog .el-dialog__headerbtn:hover) {
  background: rgba(61, 199, 188, 0.08);
}

:deep(.todo-dialog.el-dialog .el-dialog__headerbtn .el-dialog__close),
:deep(.todo-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--todo-dialog-text-secondary);
  font-size: 18px;
}

:deep(.todo-dialog.el-dialog .el-dialog__body),
:deep(.todo-dialog .el-dialog__body) {
  padding: 24px 28px 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 251, 0.99));
}

:deep(.todo-dialog.el-dialog .el-dialog__footer),
:deep(.todo-dialog .el-dialog__footer) {
  padding: 14px 28px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.92);
  background: linear-gradient(180deg, rgba(249, 252, 252, 0.98), rgba(243, 248, 249, 0.98));
}

:deep(.todo-dialog.el-dialog .el-button),
:deep(.todo-dialog .el-button) {
  min-height: 40px;
  padding: 10px 18px;
  border-radius: 14px;
  font-weight: 600;
}

:deep(.todo-dialog.el-dialog .el-button:not(.el-button--primary)),
:deep(.todo-dialog .el-button:not(.el-button--primary)) {
  color: var(--todo-dialog-text-secondary);
  border-color: rgba(208, 220, 228, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

:deep(.todo-dialog.el-dialog .el-button:not(.el-button--primary):hover),
:deep(.todo-dialog .el-button:not(.el-button--primary):hover) {
  color: var(--todo-dialog-text);
  border-color: rgba(157, 224, 217, 0.98);
  background: rgba(247, 251, 251, 0.98);
}

:deep(.todo-dialog.el-dialog .el-button--primary),
:deep(.todo-dialog .el-button--primary) {
  border: none;
  background: linear-gradient(135deg, #44c9bf 0%, #2ea79f 100%);
  box-shadow: 0 14px 28px rgba(61, 199, 188, 0.28);
}

:deep(.todo-dialog.el-dialog .el-button--primary:hover),
:deep(.todo-dialog .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(61, 199, 188, 0.34);
}

.detail-hero {
  padding: 22px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(61, 199, 188, 0.14), transparent 28%),
    linear-gradient(135deg, rgba(244, 250, 249, 0.98), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(208, 220, 228, 0.92);
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.5;
  color: #162033;
}

.detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.detail-tag,
.detail-chip {
  border-radius: 999px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  font-size: 13px;
  color: #607086;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(208, 220, 228, 0.92);
}

.detail-chip--accent {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.18);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.detail-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(228, 235, 241, 0.96);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-card-label {
  font-size: 12px;
  color: #94a3b8;
}

.detail-card strong {
  color: #162033;
  line-height: 1.6;
}

.timeline-block {
  margin-top: 22px;
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(250, 253, 253, 0.9);
  border: 1px solid rgba(228, 235, 241, 0.96);
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline-header h4 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #162033;
}

.timeline-header p {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.timeline-count {
  font-size: 13px;
  font-weight: 600;
  color: #1b9c94;
}

.completion-timeline {
  padding-top: 6px;
}

.timeline-item-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(228, 235, 241, 0.96);
}

.timeline-item-card strong {
  color: #162033;
}

.timeline-item-card span {
  color: #607086;
  font-size: 13px;
}

.timeline-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.timeline-edit-btn {
  font-size: 13px;
  padding: 0;
}

.detail-empty {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px dashed rgba(183, 205, 214, 0.72);
  color: #607086;
}

@media (max-width: 768px) {
  :deep(.todo-dialog.el-dialog),
  :deep(.todo-dialog .el-dialog) {
    width: calc(100vw - 24px) !important;
    margin-top: 0 !important;
    border-radius: 24px;
  }

  :deep(.todo-dialog.el-dialog .el-dialog__header),
  :deep(.todo-dialog .el-dialog__header) {
    padding: 20px 18px 14px;
  }

  :deep(.todo-dialog.el-dialog .el-dialog__body),
  :deep(.todo-dialog .el-dialog__body) {
    padding: 20px 18px 10px;
  }

  :deep(.todo-dialog.el-dialog .el-dialog__footer),
  :deep(.todo-dialog .el-dialog__footer) {
    padding: 12px 18px 18px;
  }

  .detail-title-row,
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
