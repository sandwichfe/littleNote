<template>
  <!-- 添加任务对话框 -->
  <el-dialog 
    v-model="showAddTaskDialog" 
    title="添加新待办" 
    width="500px"
  >
    <el-form :model="newTask" label-width="80px">
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
        <el-input-number v-model="newTask.targetCount" :min="1" :max="50" placeholder="需要完成的次数" />
      </el-form-item>
      <el-form-item label="鼓励语">
        <el-input v-model="newTask.encouragement" placeholder="完成后的鼓励语" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancelAddTask">取消</el-button>
      <el-button type="primary" @click="handleConfirmAddTask">确定</el-button>
    </template>
  </el-dialog>

  <!-- 添加奖励对话框 -->
  <el-dialog 
    v-model="showAddRewardDialog" 
    title="创建新奖励" 
    width="500px"
  >
    <el-form :model="newReward" label-width="80px">
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
import { ref, reactive, watch } from 'vue'

// Props
const props = defineProps({
  showAddTaskDialog: {
    type: Boolean,
    default: false
  },
  showAddRewardDialog: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'update:showAddTaskDialog',
  'update:showAddRewardDialog',
  'add-task',
  'add-reward'
])

// 本地状态
const showAddTaskDialog = ref(props.showAddTaskDialog)
const showAddRewardDialog = ref(props.showAddRewardDialog)

// 监听props变化
watch(() => props.showAddTaskDialog, (val) => {
  showAddTaskDialog.value = val
})

watch(() => props.showAddRewardDialog, (val) => {
  showAddRewardDialog.value = val
})

// 监听本地状态变化，同步到父组件
watch(showAddTaskDialog, (val) => {
  emit('update:showAddTaskDialog', val)
})

watch(showAddRewardDialog, (val) => {
  emit('update:showAddRewardDialog', val)
})

// 新任务表单
const newTask = ref({
  content: '',
  type: '',
  points: 10,
  encouragement: '',
  targetCount: 1
})

// 新奖励表单
const newReward = reactive({
  name: '',
  description: '',
  points: 100
})

// 处理添加任务
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
    targetCount: 1
  }
}

// 处理添加奖励
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
/* 对话框样式可以根据需要自定义 */
</style>