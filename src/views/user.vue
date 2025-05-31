<template>
  <div class="user-container">
    <!-- 新增用户按钮和表格 -->
    <el-button type="primary" @click="handleCreate">新增用户</el-button>
    
    <el-table :data="userList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="nickname" label="昵称"></el-table-column>
      <el-table-column prop="username" label="账号"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="mobile" label="手机号"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      :page-size="pageSize"
      :current-page="currentPage"
      layout="prev, pager, next"
      :total="total"
      @current-change="handlePageChange"
    />

    <!-- 用户表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="isCreate">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号"></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  createUser, 
  getUserById, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} from '../network/user'

// 用户列表和加载状态
const userList = ref([])
const loading = ref(false)

// 分页相关状态
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)

// 对话框相关状态
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)

// 表单数据和校验规则
const form = reactive({
  id: null,
  nickname: '',
  username: '',
  password: '',
  email: '',
  mobile: ''
})

const rules = reactive({
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

// 生命周期钩子
onMounted(() => {
  fetchUsers()
})

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await getAllUsers({ pageNum: currentPage.value, pageSize: pageSize.value })
    userList.value = response.data.records
    total.value = response.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 分页改变事件
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchUsers()
}

// 新建用户
const handleCreate = () => {
  isCreate.value = true
  formTitle.value = '新建用户'
  Object.keys(form).forEach(key => form[key] = key === 'id' ? null : '')
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = async (row) => {
  try {
    const response = await getUserById(row.id)
    Object.assign(form, response.data)
    isCreate.value = false
    formTitle.value = '编辑用户'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取用户信息失败:', error)  // 打印错误详情
    ElMessage.error('获取用户信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    if (isCreate.value) {
      await createUser(form)
      ElMessage.success('创建用户成功')
    } else {
      await updateUser(form)
      ElMessage.success('更新用户成功')
    }
    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    console.error('操作失败:', error)  // 打印错误详情
    ElMessage.error('操作失败')
  }
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该用户？', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUsers()
    } catch (error) {
      console.error('删除失败:', error)  // 打印错误详情
      ElMessage.error('删除失败')
    }
  })
}
</script>

<style scoped>
.user-container {
  padding: 20px;
  background-color: #ffffff; /* Consistent background */
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-button {
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  background-color: #eef1f6;
  color: #333;
  font-weight: 600;
}

.el-table td,
.el-table th {
  padding: 12px 0;
}

.el-table .el-button {
  margin-right: 5px;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}

.el-dialog {
  border-radius: 8px;
}

.el-dialog__header {
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.el-dialog__footer {
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.el-table__row {
  opacity: 0;
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.el-table__row:nth-child(odd) {
  animation-delay: 0.1s;
}
.el-table__row:nth-child(even) {
  animation-delay: 0.2s;
}
</style>