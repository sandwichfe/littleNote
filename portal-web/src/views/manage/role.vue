<template>
  <section class="manage-page">
    <header class="manage-page__hero">

      <div class="manage-page__actions">

        <el-button class="manage-secondary-button" @click="fetchRoles">
          <el-icon><Refresh /></el-icon>
          刷新角色
        </el-button>

        <el-button type="primary" class="manage-primary-button" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建角色
        </el-button>
      </div>
    </header>

    <section class="manage-surface manage-table">
      <div class="manage-surface__header">
        <div class="manage-surface__header-title">
          <h2>角色列表</h2>
        </div>

      </div>

      <div class="manage-surface__body">
        <el-table :data="roleList" v-loading="loading" height="100%">
          <el-table-column label="角色" min-width="240">
            <template #default="{ row }">
              <div class="manage-entity">

                <span class="manage-entity__text">
                  <span class="manage-entity__title">{{ row.roleName }}</span>
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="说明" min-width="280">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span>{{ row.description || '暂未补充角色说明' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="280" align="right">
            <template #default="{ row }">
              <div class="manage-row-actions">
                <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
                <el-button text type="warning" @click="handleAssignMenu(row)">分配菜单</el-button>
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
      width="680px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="manage-form-grid">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入角色说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitForm">保存角色</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="menuDialogVisible"
      title="分配菜单"
      width="720px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleMenuDialogClosed"
    >
      <div class="manage-tree-card">
        <el-tree
          ref="menuTree"
          :data="allMenus"
          show-checkbox
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :props="{ label: 'name', children: 'children' }"
        />
      </div>

      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitAssignMenu">保存分配</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Connection,
  Grid,
  Menu as MenuIcon,
  Plus,
  Refresh
} from '@element-plus/icons-vue'
import { createRole, deleteRole, getAllRoles, getRoleById, updateRole } from '@/network/manage/role'
import { getTreeMenus } from '@/network/manage/menu'
import { assignMenusToRole, getMenusByRoleId } from '@/network/manage/roleMenu'
import { countTreeNodes, formatDateTime, getInitial } from './manage-utils'

const createDefaultForm = () => ({
  id: null,
  roleName: '',
  deleted: false,
  sort: 0,
  createTime: null,
  createUserId: null,
  description: ''
})

const roleList = ref([])
const loading = ref(false)
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)
const menuDialogVisible = ref(false)
const allMenus = ref([])
const currentRoleMenus = ref([])
const currentRoleId = ref(null)
const menuTree = ref(null)
const formRef = ref()
const form = reactive(createDefaultForm())

const rules = reactive({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
})

const menuNodeCount = computed(() => countTreeNodes(allMenus.value))
const describedRoleCount = computed(() => roleList.value.filter(item => item.description).length)

const resetForm = () => {
  Object.assign(form, createDefaultForm())
}

const handleDialogClosed = () => {
  formRef.value?.clearValidate?.()
  resetForm()
}

const handleMenuDialogClosed = () => {
  currentRoleMenus.value = []
  currentRoleId.value = null
  menuTree.value?.setCheckedKeys?.([])
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

onMounted(() => {
  fetchRoles()
  fetchAllMenus()
})

const fetchRoles = async () => {
  try {
    loading.value = true
    const response = await getAllRoles({ pageNum: currentPage.value, pageSize: pageSize.value })
    roleList.value = response.data?.records || []
    total.value = response.data?.total || 0
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const fetchAllMenus = async () => {
  try {
    const response = await getTreeMenus({ pageNum: 1, pageSize: 1000 })
    allMenus.value = response.data || []
  } catch (error) {
    console.error('获取菜单树失败:', error)
  }
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchRoles()
}

const handleCreate = () => {
  resetForm()
  isCreate.value = true
  formTitle.value = '新建角色'
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const response = await getRoleById(row.id)
    resetForm()
    Object.assign(form, {
      ...createDefaultForm(),
      ...response.data
    })
    isCreate.value = false
    formTitle.value = '编辑角色'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取角色信息失败:', error)
    ElMessage.error('获取角色信息失败')
  }
}

const submitForm = async () => {
  const valid = await validateForm()

  if (!valid) {
    return
  }

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
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该角色吗？', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRole(row.id)
      ElMessage.success('删除成功')
      fetchRoles()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleAssignMenu = async (row) => {
  currentRoleId.value = row.id
  menuTree.value?.setCheckedKeys?.([])

  try {
    const response = await getMenusByRoleId(row.id)
    currentRoleMenus.value = response.data || []
    menuDialogVisible.value = true

    await nextTick()
    menuTree.value?.setCheckedKeys?.(currentRoleMenus.value)
  } catch (error) {
    console.error('获取角色菜单失败:', error)
    ElMessage.error('获取角色菜单失败')
  }
}

const submitAssignMenu = async () => {
  try {
    const checkedKeys = menuTree.value?.getCheckedKeys?.() || []
    await assignMenusToRole(currentRoleId.value, checkedKeys)
    ElMessage.success('分配菜单成功')
    menuDialogVisible.value = false
  } catch (error) {
    console.error('分配菜单失败:', error)
    ElMessage.error('分配菜单失败')
  }
}
</script>
