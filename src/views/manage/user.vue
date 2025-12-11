<template>
  <div class="user-container">
    <el-container style="height: 100%">
      <!-- 左侧部门树 -->
      <el-aside width="220px" class="dept-sidebar">
        <div class="sidebar-header">
          <span>部门列表</span>
          <el-button link type="primary" @click="fetchDepts">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div class="sidebar-content">
          <el-tree
            ref="deptTreeRef"
            :data="allDepts"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            highlight-current
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <el-icon v-if="data.children && data.children.length"><Folder /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span class="node-label">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </el-aside>

      <!-- 右侧用户列表 -->
      <el-main class="user-main">
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
          <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
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
      </el-main>
    </el-container>

    <!-- 用户表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="所属部门" prop="deptIds">
          <el-cascader
            v-model="form.deptIds"
            :options="allDepts"
            :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children', emitPath: false, multiple: true }"
            placeholder="请选择部门"
            clearable
            style="width: 100%"
          />
        </el-form-item>
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
import { getTreeDepts } from '@/network/dept'
import { getRolesByUserId, assignRolesToUser } from '@/network/userRole'
import { Plus, Folder, Document, Refresh } from '@element-plus/icons-vue'

// 用户列表和加载状态
const userList = ref([])
const loading = ref(false)

// 部门相关状态
const allDepts = ref([])
const currentDeptId = ref(null)
const deptTreeRef = ref(null)

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
  deptIds: [],
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
  fetchDepts()
  fetchUsers()
  fetchAllRoles()
})

// 获取部门树
const fetchDepts = async () => {
  try {
    const response = await getTreeDepts()
    allDepts.value = response.data
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
  }
}

// 部门节点点击
const handleNodeClick = (data) => {
  currentDeptId.value = data.id
  currentPage.value = 1 // 重置页码
  fetchUsers()
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const params = { 
      pageNum: currentPage.value, 
      pageSize: pageSize.value,
      deptId: currentDeptId.value 
    }
    const response = await getAllUsers(params)
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
  Object.keys(form).forEach(key => form[key] = key === 'id' ? null : (key === 'deptIds' ? [] : ''))
  // 如果当前选中了部门，自动填充
  if (currentDeptId.value) {
    form.deptIds = [currentDeptId.value]
  }
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

.dept-sidebar {
  border-right: 1px solid #e6e6e6;
  margin-right: 16px;
  padding-right: 16px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #e6e6e6;
  margin-bottom: 8px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.user-main {
  padding: 0 !important; /* Remove default padding to align with layout */
  display: flex;
  flex-direction: column;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}

/* Element Plus 样式覆盖 */
:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f7ff;
  color: #409eff;
}
</style>
