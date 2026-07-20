<template>
  <section class="manage-page role-page">
    <!-- 可折叠搜索条件 -->
    <section class="manage-search-panel" :class="{ 'is-open': searchExpanded }">
      <button type="button" class="manage-search-panel__toggle" @click="searchExpanded = !searchExpanded">
        <el-icon class="manage-search-panel__arrow"><ArrowRight /></el-icon>
        <span>搜索</span>
      </button>
      <div v-show="searchExpanded" class="manage-search-panel__body">
        <section class="manage-filter">
          <el-input
            v-model="queryForm.roleName"
            class="manage-filter__control"
            clearable
            placeholder="角色名称"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryForm.description"
            class="manage-filter__control"
            clearable
            placeholder="角色说明"
            @keyup.enter="handleSearch"
          />
          <div class="manage-filter__actions">
            <el-button class="manage-secondary-button" @click="handleResetQuery">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button type="primary" class="manage-primary-button" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </section>
      </div>
    </section>

    <!-- 列表卡：左标题，右新增 / 刷新 -->
    <section class="manage-surface manage-table">
      <div class="manage-surface__header">
        <div class="manage-surface__header-title">
          <h2>角色列表</h2>
        </div>
        <div class="manage-surface__header-side">
          <el-button type="primary" class="manage-primary-button" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
          <el-button class="manage-secondary-button" @click="fetchRoles">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
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
                <span>{{ row.description || '--' }}</span>
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
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, prev, pager, next, sizes"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="560px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="manage-form-grid"
      >
        <el-form-item class="manage-form-grid__full" label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item class="manage-form-grid__full" label="角色描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入角色说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button class="manage-secondary-button" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="menuDialogVisible"
      title="分配菜单"
      width="560px"
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
        <el-button class="manage-secondary-button" @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitAssignMenu">保存分配</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { createRole, deleteRole, getAllRoles, getRoleById, updateRole } from '@/network/manage/role'
import { getTreeMenus } from '@/network/manage/menu'
import { assignMenusToRole, getMenusByRoleId } from '@/network/manage/roleMenu'
import { formatDateTime } from './manage-utils'

const createDefaultForm = () => ({
  id: null,
  roleName: '',
  deleted: false,
  sort: 0,
  createTime: null,
  createUserId: null,
  description: ''
})

// 查询条件（空值不传给接口）
const createDefaultQuery = () => ({
  roleName: '',
  description: ''
})

const roleList = ref([])
const loading = ref(false)
// 搜索面板展开状态（默认收起）
const searchExpanded = ref(false)
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
const queryForm = reactive(createDefaultQuery())

const rules = reactive({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
})

const resetForm = () => {
  Object.assign(form, createDefaultForm())
}

// 组装列表查询参数：分页 + 非空筛选
const buildListQuery = () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value
  }
  const roleName = String(queryForm.roleName || '').trim()
  const description = String(queryForm.description || '').trim()

  if (roleName) {
    params.roleName = roleName
  }
  if (description) {
    params.description = description
  }

  return params
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
    const response = await getAllRoles(buildListQuery())
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

// 查询：从第一页开始
const handleSearch = () => {
  currentPage.value = 1
  fetchRoles()
}

// 重置查询条件并刷新
const handleResetQuery = () => {
  Object.assign(queryForm, createDefaultQuery())
  currentPage.value = 1
  fetchRoles()
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchRoles()
}

// 切换每页条数后回到第一页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
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

