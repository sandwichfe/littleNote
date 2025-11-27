<template>
  <div class="user-container">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleCreate" class="toolbar-btn">
          <el-icon><Plus /></el-icon>
          <span>新增用户</span>
        </el-button>
      </div>
    </div>
    
    <el-table :data="userList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="nickname" label="昵称"></el-table-column>
      <el-table-column prop="username" label="账号"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="mobile" label="手机号"></el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          <el-button size="small" type="warning" @click="handleAssignRole(scope.row)">分配角色</el-button>
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

    <!-- 分配角色对话框 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" @opened="setTreeKeys" @close="handleClose">
      <el-tree
        :data="allRoles"
        show-checkbox
        node-key="id"
        :props="{ label: 'roleName', children: 'children' }"
        ref="roleTree"
      />
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  createUser, 
  getUserById, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} from '@/network/user'
import { getAllRoles } from '@/network/role'
import { getRolesByUserId, assignRolesToUser } from '@/network/userRole'
import { Plus } from '@element-plus/icons-vue'

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

// 角色分配对话框
const roleDialogVisible = ref(false)
const allRoles = ref([])
const currentUserRoles = ref([])
const currentUserId = ref(null)
const roleTree = ref(null)

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
  fetchAllRoles()
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

// 获取所有角色
const fetchAllRoles = async () => {
  try {
    const response = await getAllRoles({ pageNum: 1, pageSize: 1000 })
    allRoles.value = response.data.records
  } catch (error) {
    console.error('获取所有角色失败:', error)
  }
}

// 打开分配角色对话框
const handleAssignRole = async (row) => {
  currentUserId.value = row.id
  try {
    const response = await getRolesByUserId(row.id)
    currentUserRoles.value = response.data
    roleDialogVisible.value = true
  } catch (error) {
    console.error('获取用户角色失败:', error)
    ElMessage.error('获取用户角色失败')
  }
}

const setTreeKeys = () => {
  if (roleTree.value) {
    roleTree.value.setCheckedKeys(currentUserRoles.value)
  }
}

const handleClose = () => {
  currentUserRoles.value = []
}

// 提交角色分配
const submitAssignRole = async () => {
  try {
    const checkedKeys = roleTree.value.getCheckedKeys()
    await assignRolesToUser(currentUserId.value, checkedKeys)
    ElMessage.success('分配角色成功')
    roleDialogVisible.value = false
  } catch (error) {
    console.error('分配角色失败:', error)
    ElMessage.error('分配角色失败')
  }
}
</script>

<style scoped>
.user-container {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: #5f6368;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.toolbar-btn:hover {
  background-color: #202124;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12);
}

.toolbar-btn:active {
  transform: scale(0.98);
  background-color: #3c4043;
}

.el-table {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e8e8e8;
  flex-grow: 1;
}

.el-table th {
  background-color: #fafafa;
  color: #333;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
}

.el-table td {
  border-bottom: 1px solid #f0f0f0;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .user-container {
    padding: 10px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    justify-content: flex-start;
  }
}
</style>