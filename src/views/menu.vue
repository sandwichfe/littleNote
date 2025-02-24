<template>
  <div class="menu-container">
    <!-- 新增菜单按钮和表格 -->
    <el-button type="primary" @click="handleCreate">新增菜单</el-button>
    
    <el-table 
      :data="menuList" 
      style="width: 100%" 
      v-loading="loading"
      row-key="id"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column prop="name" label="菜单名称"></el-table-column>
      <el-table-column prop="path" label="路径"></el-table-column>
      <el-table-column prop="type" label="类型"></el-table-column>
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

    <!-- 菜单表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="父级菜单" prop="menuPid">
          <el-cascader
            v-model="form.menuPid"
            :options="allMenus"
            :props="{ checkStrictly: true, value: 'id', label: 'title', children: 'children' }"
            placeholder="请选择父级菜单"
            clearable
            @visible-change="handleCascaderVisibleChange"
            @change="handleCascaderChange"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称"></el-input>
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入路径"></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-input v-model="form.type" placeholder="请输入类型"></el-input>
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
  createMenu, 
  getMenuById, 
  getAllMenus, 
  getTreeMenus,
  updateMenu, 
  deleteMenu 
} from '../network/menu'

// 菜单列表和加载状态
const menuList = ref([])
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
  name: '',
  path: '',
  type: '',
  menuPid: null // 新增父级菜单ID字段
})

const rules = reactive({
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  type: [{ required: true, message: '请输入类型', trigger: 'blur' }]
})

// 获取菜单列表时，需要获取所有菜单用于选择父级菜单
const allMenus = ref([])

onMounted(async () => {
  await fetchMenus()
  // 修改为获取树形菜单数据
  const response = await getTreeMenus({ pageNum: 1, pageSize: 1000 })
  allMenus.value = response.data
})

// 获取菜单列表
const fetchMenus = async () => {
  try {
    loading.value = true
    const response = await getTreeMenus({ pageNum: currentPage.value, pageSize: pageSize.value })
    menuList.value = response.data
    total.value = response.data.length
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    ElMessage.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

// 分页改变事件
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchMenus()
}

// 新建菜单
const handleCreate = () => {
  isCreate.value = true
  formTitle.value = '新建菜单'
  Object.keys(form).forEach(key => form[key] = key === 'id' ? null : '')
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = async (row) => {
  try {
    const response = await getMenuById(row.id)
    Object.assign(form, response.data)
    isCreate.value = false
    formTitle.value = '编辑菜单'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取菜单信息失败:', error)
    ElMessage.error('获取菜单信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    if (isCreate.value) {
      await createMenu(form)
      ElMessage.success('创建菜单成功')
    } else {
      await updateMenu(form)
      ElMessage.success('更新菜单成功')
    }
    dialogVisible.value = false
    fetchMenus()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 删除菜单
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该菜单？', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMenu(row.id)
      ElMessage.success('删除成功')
      fetchMenus()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const handleCascaderVisibleChange = async (visible) => {
  if (visible) {
    try {
      const response = await getTreeMenus({ pageNum: 1, pageSize: 1000 })
      allMenus.value = response.data
    } catch (error) {
      console.error('获取菜单数据失败:', error)
      ElMessage.error('获取菜单数据失败')
    }
  }
}

// 处理级联选择器变化事件
const handleCascaderChange = (value) => {
  if (value && value.length > 0) {
    form.menuPid = value[value.length - 1]; // 获取最后一级的 ID
  } else {
    form.menuPid = null;
  }
}

</script>

<style scoped>
.menu-container {
  padding: 20px;
}
</style>