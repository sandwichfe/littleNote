<template>
  <div class="dept-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleCreate" class="toolbar-btn">
          <el-icon><Plus /></el-icon>
          <span>新增部门</span>
        </el-button>
      </div>
    </div>
    
    <el-table 
      :data="deptList" 
      style="width: 100%" 
      v-loading="loading"
      row-key="id"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column prop="name" label="部门名称"></el-table-column>
      <el-table-column prop="sort" label="排序" width="80"></el-table-column>
      <el-table-column prop="leader" label="负责人"></el-table-column>
      <el-table-column prop="phone" label="联系电话"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status ? 'danger' : 'success'">
            {{ scope.row.status ? '停用' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 部门表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="上级部门" prop="parentId">
          <el-cascader
            v-model="form.parentId"
            :options="allDepts"
            :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children', emitPath: false }"
            placeholder="请选择上级部门"
            clearable
            @visible-change="handleCascaderVisibleChange"
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称"></el-input>
        </el-form-item>
        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right"></el-input-number>
        </el-form-item>
        <el-form-item label="负责人" prop="leader">
          <el-input v-model="form.leader" placeholder="请输入负责人"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="部门状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="false">正常</el-radio>
            <el-radio :label="true">停用</el-radio>
          </el-radio-group>
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
import { createDept, deleteDept, getDeptById, getTreeDepts, updateDept } from '@/network/dept'
import { Plus } from '@element-plus/icons-vue'

// 部门列表和加载状态
const deptList = ref([])
const loading = ref(false)

// 对话框相关状态
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)

// 表单数据
const form = reactive({
  id: null,
  parentId: null,
  name: '',
  sort: 0,
  leader: '',
  phone: '',
  email: '',
  status: false
})

const rules = reactive({
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
})

// 所有部门数据（用于级联选择）
const allDepts = ref([])

onMounted(async () => {
  fetchDepts()
})

// 获取部门列表
const fetchDepts = async () => {
  try {
    loading.value = true
    const response = await getTreeDepts()
    deptList.value = response.data
    allDepts.value = response.data
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
}

// 新建部门
const handleCreate = () => {
  isCreate.value = true
  formTitle.value = '新建部门'
  form.id = null
  form.parentId = null
  form.name = ''
  form.sort = 0
  form.leader = ''
  form.phone = ''
  form.email = ''
  form.status = false
  dialogVisible.value = true
}

// 编辑部门
const handleEdit = async (row) => {
  try {
    const response = await getDeptById(row.id)
    Object.assign(form, response.data)
    // 确保 status 是 boolean
    form.status = !!response.data.status
    isCreate.value = false
    formTitle.value = '编辑部门'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取部门信息失败:', error)
    ElMessage.error('获取部门信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    if (isCreate.value) {
      await createDept(form)
      ElMessage.success('创建部门成功')
    } else {
      await updateDept(form)
      ElMessage.success('更新部门成功')
    }
    dialogVisible.value = false
    fetchDepts()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 删除部门
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该部门？', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDept(row.id)
      ElMessage.success('删除成功')
      fetchDepts()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const handleCascaderVisibleChange = async (visible) => {
  if (visible) {
    try {
      const response = await getTreeDepts()
      allDepts.value = response.data
    } catch (error) {
      console.error('获取部门树失败:', error)
    }
  }
}
</script>

<style scoped>
.dept-container {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
</style>
