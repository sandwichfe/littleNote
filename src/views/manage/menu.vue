<template>
  <section class="manage-page">
    <header class="manage-page__hero">

      <div class="manage-page__actions">

        <el-button class="manage-secondary-button" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新结构
        </el-button>

        <el-button type="primary" class="manage-primary-button" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建菜单
        </el-button>
      </div>
    </header>

    <section class="manage-surface manage-table">
      <div class="manage-surface__header">
        <div class="manage-surface__header-title">
          <h2>菜单树</h2>
        </div>

      </div>

      <div class="manage-surface__body">
        <el-table
          :data="menuList"
          v-loading="loading"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          height="100%"
        >
          <el-table-column label="菜单信息" min-width="260" class-name="manage-tree-column">
            <template #default="{ row }">
              <div class="manage-entity">

                <span class="manage-entity__text">
                  <span class="manage-entity__title">{{ row.name }}</span>
                  <span class="manage-entity__meta">{{ getMenuTypeMeta(row).note }}</span>
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="访问路径" min-width="220">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span>{{ row.path || '--' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getMenuTypeMeta(row).tag" effect="light" round>
                {{ getMenuTypeMeta(row).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="排序" width="100">
            <template #default="{ row }">
              {{ row.sort ?? 0 }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="220" align="right">
            <template #default="{ row }">
              <div class="manage-row-actions">
                <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
                <el-button text type="danger" @click="handleDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="manage-pagination">
        <el-pagination
          :page-size="pageSize"
          :current-page="currentPage"
          layout="prev, pager, next"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="720px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="manage-form-grid">
        <el-form-item class="manage-form-grid__full" label="父级菜单" prop="menuPid">
          <el-cascader
            v-model="form.menuPid"
            :options="allMenus"
            :props="{
              checkStrictly: true,
              value: 'id',
              label: 'name',
              children: 'children',
              emitPath: false
            }"
            placeholder="请选择父级菜单"
            clearable
            @visible-change="handleCascaderVisibleChange"
          />
        </el-form-item>

        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>

        <el-form-item label="访问路径" prop="path">
          <el-input v-model="form.path" placeholder="例如 /manage/user" />
        </el-form-item>

        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
        </el-form-item>

        <el-form-item label="菜单类型" prop="type">
          <el-input v-model="form.type" placeholder="例如 0 目录 / 1 菜单 / 2 按钮" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitForm">保存菜单</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Grid,
  Operation,
  Plus,
  Refresh
} from '@element-plus/icons-vue'
import { createMenu, deleteMenu, getMenuById, getTreeMenus, updateMenu } from '@/network/menu'
import { countTreeNodes } from './manage-utils'

const createDefaultForm = () => ({
  id: null,
  name: '',
  path: '',
  type: '',
  sort: 0,
  menuPid: null
})

const menuList = ref([])
const loading = ref(false)
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)
const allMenus = ref([])
const formRef = ref()
const form = reactive(createDefaultForm())

const rules = reactive({
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入访问路径', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入显示排序', trigger: 'change' }],
  type: [{ required: true, message: '请输入菜单类型', trigger: 'blur' }]
})

const countMatchingNodes = (nodes, predicate) => (
  nodes.reduce(
    (totalValue, node) => totalValue + (predicate(node) ? 1 : 0) + countMatchingNodes(node.children || [], predicate),
    0
  )
)

const isFolderNode = (node) => Array.isArray(node.children) && node.children.length > 0 || Number(node.type) === 0
const isPageNode = (node) => Number(node.type) === 1 || (!isFolderNode(node) && Number(node.type) !== 2)
const isActionNode = (node) => Number(node.type) === 2

const totalMenuCount = computed(() => countTreeNodes(menuList.value))
const folderCount = computed(() => countMatchingNodes(menuList.value, isFolderNode))
const pageMenuCount = computed(() => countMatchingNodes(menuList.value, isPageNode))

const resetForm = () => {
  Object.assign(form, createDefaultForm())
}

const handleDialogClosed = () => {
  formRef.value?.clearValidate?.()
  resetForm()
}

const validateForm = async () => {
  if (!formRef.value) {
    return true
  }

  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

const countVisibleNodes = (nodes) => countTreeNodes(nodes || [])

const refreshAllMenus = async () => {
  const response = await getTreeMenus({ pageNum: 1, pageSize: 1000 })
  allMenus.value = response.data || []
}

onMounted(async () => {
  await fetchMenus()
  await refreshAllMenus()
})

const fetchMenus = async () => {
  try {
    loading.value = true
    const response = await getTreeMenus({ pageNum: currentPage.value, pageSize: pageSize.value })
    menuList.value = response.data || []
    total.value = countVisibleNodes(response.data)
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    ElMessage.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  await fetchMenus()
  await refreshAllMenus()
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchMenus()
}

const handleCreate = () => {
  resetForm()
  isCreate.value = true
  formTitle.value = '新建菜单'
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const response = await getMenuById(row.id)
    resetForm()
    Object.assign(form, {
      ...createDefaultForm(),
      ...response.data
    })
    isCreate.value = false
    formTitle.value = '编辑菜单'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取菜单信息失败:', error)
    ElMessage.error('获取菜单信息失败')
  }
}

const submitForm = async () => {
  const valid = await validateForm()

  if (!valid) {
    return
  }

  try {
    if (isCreate.value) {
      await createMenu(form)
      ElMessage.success('创建菜单成功')
    } else {
      await updateMenu(form)
      ElMessage.success('更新菜单成功')
    }

    dialogVisible.value = false
    handleRefresh()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该菜单吗？', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMenu(row.id)
      ElMessage.success('删除成功')
      handleRefresh()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleCascaderVisibleChange = async (visible) => {
  if (!visible) {
    return
  }

  try {
    await refreshAllMenus()
  } catch (error) {
    console.error('获取菜单数据失败:', error)
    ElMessage.error('获取菜单数据失败')
  }
}

const getMenuTypeMeta = (row) => {
  if (isFolderNode(row)) {
    return {
      label: '目录',
      tag: 'info',
      note: '',
      icon: Collection
    }
  }

  if (isActionNode(row)) {
    return {
      label: '按钮',
      tag: 'warning',
      note: '',
      icon: Operation
    }
  }

  return {
    label: '菜单',
    tag: 'success',
    note: '',
    icon: Grid
  }
}
</script>
