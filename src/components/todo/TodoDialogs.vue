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
      <el-form-item label="积分奖励">
        <el-input-number v-model="newTask.points" :min="1" :max="100" />
      </el-form-item>
      <el-form-item label="目标次数">
        <el-input-number
          v-model="newTask.targetCount"
          :min="1"
          :max="50"
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
      <el-form-item label="积分奖励">
        <el-input-number v-model="editTaskForm.points" :min="1" :max="100" />
      </el-form-item>
      <el-form-item label="目标次数">
        <el-input-number
          v-model="editTaskForm.targetCount"
          :min="1"
          :max="50"
          placeholder="需要完成的次数"
        />
        <div v-if="editTaskForm.targetCount > 1" class="limit-toggle">
          <el-checkbox v-model="editTaskForm.isDailyLimit" :true-label="1" :false-label="0">
            每日仅可完成一次
          </el-checkbox>
        </div>
      </el-form-item>
      <el-form-item label="鼓励语">
        <el-input v-model="editTaskForm.encouragement" placeholder="完成后的鼓励语" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancelEditTask">取消</el-button>
      <el-button type="primary" @click="handleConfirmEditTask">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showAddRewardDialog"
    title="创建新奖励"
    width="500px"
    class="todo-dialog"
  >
    <el-form :model="newReward" label-width="88px" class="todo-dialog-form">
      <el-form-item label="奖励名称">
        <el-input v-model="newReward.name" placeholder="请输入奖励名称" />
      </el-form-item>
      <el-form-item label="奖励描述">
        <el-input v-model="newReward.description" placeholder="请输入奖励描述" />
      </el-form-item>
      <el-form-item label="所需积分">
        <el-input-number v-model="newReward.points" :min="1" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancelAddReward">取消</el-button>
      <el-button type="primary" @click="handleConfirmAddReward">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

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
  editingTask: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:showAddTaskDialog',
  'update:showAddRewardDialog',
  'update:showEditTaskDialog',
  'add-task',
  'add-reward',
  'update-task'
])

const showAddTaskDialog = ref(props.showAddTaskDialog)
const showAddRewardDialog = ref(props.showAddRewardDialog)
const showEditTaskDialog = ref(props.showEditTaskDialog)

watch(
  () => props.showAddTaskDialog,
  (value) => {
    showAddTaskDialog.value = value
  }
)

watch(
  () => props.showAddRewardDialog,
  (value) => {
    showAddRewardDialog.value = value
  }
)

watch(
  () => props.showEditTaskDialog,
  (value) => {
    showEditTaskDialog.value = value
    if (value && props.editingTask) {
      editTaskForm.value = { ...props.editingTask }
    }
  }
)

watch(showAddTaskDialog, (value) => {
  emit('update:showAddTaskDialog', value)
})

watch(showAddRewardDialog, (value) => {
  emit('update:showAddRewardDialog', value)
})

watch(showEditTaskDialog, (value) => {
  emit('update:showEditTaskDialog', value)
})

const newTask = ref({
  content: '',
  type: 'work',
  points: 10,
  targetCount: 1,
  isDailyLimit: 0
})

const editTaskForm = ref({
  id: null,
  content: '',
  type: '',
  points: 10,
  encouragement: '',
  targetCount: 1,
  isDailyLimit: 0
})

const newReward = reactive({
  name: '',
  description: '',
  points: 100
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
  newTask.value = {
    content: '',
    type: '',
    points: 10,
    encouragement: '',
    targetCount: 1,
    isDailyLimit: 0
  }
}

const handleConfirmEditTask = () => {
  emit('update-task', { ...editTaskForm.value })
  showEditTaskDialog.value = false
}

const handleCancelEditTask = () => {
  showEditTaskDialog.value = false
}

const handleConfirmAddReward = () => {
  emit('add-reward', { ...newReward })
  resetRewardForm()
}

const handleCancelAddReward = () => {
  showAddRewardDialog.value = false
  resetRewardForm()
}

const resetRewardForm = () => {
  Object.assign(newReward, {
    name: '',
    description: '',
    points: 100
  })
}
</script>

<style scoped>
.todo-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-dialog-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.todo-dialog-form :deep(.el-form-item__label) {
  color: #475569;
  font-weight: 600;
}

.todo-dialog-form :deep(.el-input__wrapper),
.todo-dialog-form :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(226, 232, 255, 0.95);
}

.todo-dialog-form :deep(.el-input__wrapper:hover),
.todo-dialog-form :deep(.el-select__wrapper:hover),
.todo-dialog-form :deep(.el-input-number:hover) {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(165, 180, 252, 0.95);
}

.todo-dialog-form :deep(.el-input__wrapper.is-focus),
.todo-dialog-form :deep(.is-focused.el-select__wrapper),
.todo-dialog-form :deep(.el-textarea__inner:focus),
.todo-dialog-form :deep(.el-input-number.is-focus) {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(99, 102, 241, 0.9),
    0 0 0 4px rgba(99, 102, 241, 0.08);
}

.todo-dialog-form :deep(.el-input__inner),
.todo-dialog-form :deep(.el-select__placeholder),
.todo-dialog-form :deep(.el-textarea__inner),
.todo-dialog-form :deep(.el-input-number .el-input__inner) {
  color: #1e293b;
}

.todo-dialog-form :deep(.el-input),
.todo-dialog-form :deep(.el-select) {
  width: 100%;
}

.todo-dialog-form :deep(.el-textarea__inner) {
  min-height: 96px;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(226, 232, 255, 0.95);
}

.todo-dialog-form :deep(.el-input-number) {
  width: 100%;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(226, 232, 255, 0.95);
}

.todo-dialog-form :deep(.el-input-number .el-input__wrapper) {
  box-shadow: none;
  background: transparent;
}

.todo-dialog-form :deep(.el-input-number__increase),
.todo-dialog-form :deep(.el-input-number__decrease) {
  width: 30px;
  color: #6366f1;
  background: rgba(238, 242, 255, 0.9);
  border-left: 1px solid rgba(224, 231, 255, 0.95);
}

.todo-dialog-form :deep(.el-checkbox__label) {
  color: #64748b;
}

.todo-dialog-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: linear-gradient(135deg, #8e6ff7, #4f46e5);
  border-color: #6366f1;
}

.limit-toggle {
  margin-top: 10px;
}

:deep(.todo-dialog) {
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(199, 210, 254, 0.72);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 255, 0.98));
  box-shadow:
    0 28px 80px rgba(79, 70, 229, 0.18),
    0 12px 36px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

:deep(.todo-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px 14px;
  background: linear-gradient(135deg, rgba(238, 244, 255, 0.92), rgba(248, 245, 255, 0.96));
  border-bottom: 1px solid rgba(226, 232, 255, 0.95);
}

:deep(.todo-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: #312e81;
  letter-spacing: 0.02em;
}

:deep(.todo-dialog .el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

:deep(.todo-dialog .el-dialog__headerbtn:hover) {
  background: rgba(99, 102, 241, 0.08);
}

:deep(.todo-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #818cf8;
  font-size: 18px;
}

:deep(.todo-dialog .el-dialog__body) {
  padding: 22px 24px 10px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.96), rgba(243, 247, 255, 0.98));
}

:deep(.todo-dialog .el-dialog__footer) {
  padding: 12px 24px 22px;
  border-top: 1px solid rgba(226, 232, 255, 0.72);
  background: linear-gradient(180deg, rgba(248, 250, 255, 0.85), rgba(241, 245, 255, 0.95));
}

:deep(.todo-dialog .el-button) {
  border-radius: 12px;
  font-weight: 600;
  padding: 10px 18px;
  transition: all 0.22s ease;
}

:deep(.todo-dialog .el-button:not(.el-button--primary)) {
  color: #475569;
  border-color: rgba(203, 213, 225, 0.95);
  background: rgba(255, 255, 255, 0.82);
}

:deep(.todo-dialog .el-button:not(.el-button--primary):hover) {
  color: #4338ca;
  border-color: rgba(165, 180, 252, 0.95);
  background: rgba(238, 242, 255, 0.9);
}

:deep(.todo-dialog .el-button--primary) {
  border: none;
  background-image: linear-gradient(135deg, #8e6ff7, #4f46e5);
  box-shadow: 0 12px 26px rgba(79, 70, 229, 0.28);
}

:deep(.todo-dialog .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(79, 70, 229, 0.32);
}

@media (max-width: 768px) {
  :deep(.todo-dialog) {
    width: calc(100vw - 24px) !important;
    margin-top: 0 !important;
  }

  :deep(.todo-dialog .el-dialog__header) {
    padding: 18px 18px 12px;
  }

  :deep(.todo-dialog .el-dialog__body) {
    padding: 18px 18px 8px;
  }

  :deep(.todo-dialog .el-dialog__footer) {
    padding: 12px 18px 18px;
  }
}
</style>
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

.todo-dialog-form :deep(.el-textarea__inner) {
  min-height: 104px;
  padding: 12px 14px;
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

  border-radius: 30px;
  overflow: hidden;
  border: 1px solid rgba(228, 235, 241, 0.92);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 252, 0.99));
  box-shadow: var(--todo-dialog-shadow);
}

:deep(.todo-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 24px 28px 16px;
  background: linear-gradient(135deg, rgba(241, 251, 249, 0.96), rgba(250, 253, 253, 0.98));
  border-bottom: 1px solid var(--todo-dialog-border);
}

:deep(.todo-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: var(--todo-dialog-text);
  letter-spacing: 0.01em;
}

:deep(.todo-dialog .el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

:deep(.todo-dialog .el-dialog__headerbtn:hover) {
  background: rgba(61, 199, 188, 0.08);
}

:deep(.todo-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--todo-dialog-text-secondary);
  font-size: 18px;
}

:deep(.todo-dialog .el-dialog__body) {
  padding: 24px 28px 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 251, 0.99));
}

:deep(.todo-dialog .el-dialog__footer) {
  padding: 14px 28px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.92);
  background: linear-gradient(180deg, rgba(249, 252, 252, 0.98), rgba(243, 248, 249, 0.98));
}

:deep(.todo-dialog .el-button) {
  min-height: 40px;
  padding: 10px 18px;
  border-radius: 14px;
  font-weight: 600;
}

:deep(.todo-dialog .el-button:not(.el-button--primary)) {
  color: var(--todo-dialog-text-secondary);
  border-color: rgba(208, 220, 228, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

:deep(.todo-dialog .el-button:not(.el-button--primary):hover) {
  color: var(--todo-dialog-text);
  border-color: rgba(157, 224, 217, 0.98);
  background: rgba(247, 251, 251, 0.98);
}

:deep(.todo-dialog .el-button--primary) {
  border: none;
  background: linear-gradient(135deg, #44c9bf 0%, #2ea79f 100%);
  box-shadow: 0 14px 28px rgba(61, 199, 188, 0.28);
}

:deep(.todo-dialog .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(61, 199, 188, 0.34);
}

@media (max-width: 768px) {
  :deep(.todo-dialog) {
    width: calc(100vw - 24px) !important;
    margin-top: 0 !important;
    border-radius: 24px;
  }

  :deep(.todo-dialog .el-dialog__header) {
    padding: 20px 18px 14px;
  }

  :deep(.todo-dialog .el-dialog__body) {
    padding: 20px 18px 10px;
  }

  :deep(.todo-dialog .el-dialog__footer) {
    padding: 12px 18px 18px;
  }
}
</style>
