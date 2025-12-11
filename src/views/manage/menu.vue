<template>
  <div class="menu-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleCreate" class="toolbar-btn">
          <el-icon><Plus /></el-icon>
          <span>新增菜单</span>
        </el-button>
      </div>
    </div>
    
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
      <el-table-column prop="sort" label="排序" width="80"></el-table-column>
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
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right"></el-input-number>
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
import {onMounted, reactive, ref} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {createMenu, deleteMenu, getMenuById, getTreeMenus, updateMenu} from '@/network/menu'
import { Plus } from '@element-plus/icons-vue'

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
  sort: 0,
  menuPid: null
})

const rules = reactive({
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
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
  form.id = null
  form.name = ''
  form.path = ''
  form.type = ''
  form.sort = 0
  form.menuPid = null
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
  padding: 16px;
  background-color: #fff;
  height: 100%;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.el-table {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e8e8e8;
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

.el-table .el-button--small {
  margin-right: 8px;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

:deep(.el-dialog__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #303133;
  border-radius: 8px 8px 0 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: #606266;
}

:deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  border-radius: 0 0 8px 8px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input .el-input__inner,
.el-cascader .el-input__inner {
  border-radius: 4px;
}

@media (max-width: 768px) {
  .menu-container {
    padding: 10px;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .el-table-column[label="操作"] {
    width: auto !important;
  }

  .el-dialog {
    width: 90% !important;
  }
}
</style>
