<template>
  <div class="role-container">
    <!-- 新增角色按钮和表格 -->
    <el-button type="primary" @click="handleCreate">新增角色</el-button>
    
    <el-table :data="roleList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="roleName" label="角色名称"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
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

    <!-- 角色表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入描述"></el-input>
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
  createRole, 
  getRoleById, 
  getAllRoles, 
  updateRole, 
  deleteRole 
} from '../network/role'

// 角色列表和加载状态
const roleList = ref([])
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
  roleName: '',
  deleted: false,
  sort: 0,
  createTime: null,
  createUserId: null
})

const rules = reactive({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
})

// 生命周期钩子
onMounted(() => {
  fetchRoles()
})

// 获取角色列表
const fetchRoles = async () => {
  try {
    loading.value = true
    const response = await getAllRoles({ pageNum: currentPage.value, pageSize: pageSize.value })
    roleList.value = response.data.records
    total.value = response.data.total
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 分页改变事件
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchRoles()
}

// 新建角色
const handleCreate = () => {
  isCreate.value = true
  formTitle.value = '新建角色'
  Object.keys(form).forEach(key => form[key] = key === 'id' ? null : '')
  dialogVisible.value = true
}

// 编辑角色
const handleEdit = async (row) => {
  try {
    const response = await getRoleById(row.id)
    Object.assign(form, {
      ...response.data,
      createTime: response.data.createTime ? new Date(response.data.createTime).toISOString() : null,
      createUserId: response.data.createUserId || null
    })
    isCreate.value = false
    formTitle.value = '编辑角色'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取角色信息失败:', error)  // 打印错误详情
    ElMessage.error('获取角色信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    if (isCreate.value) {
      await createRole(form)
      ElMessage.success('创建角色成功')
    } else {
      await updateRole(form)
      ElMessage.success('更新角色成功')
    }
    dialogVisible.value = false
    fetchRoles()
  } catch (error) {
    console.error('操作失败:', error)  // 打印错误详情
    ElMessage.error('操作失败')
  }
}

// 删除角色
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该角色？', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRole(row.id)
      ElMessage.success('删除成功')
      fetchRoles()
    } catch (error) {
      console.error('删除失败:', error)  // 打印错误详情
      ElMessage.error('删除失败')
    }
  })
}
</script>

<style scoped>
.role-container {
  padding: 20px;
}
</style>