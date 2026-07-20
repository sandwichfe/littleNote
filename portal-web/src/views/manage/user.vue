<template>
  <section class="manage-page">
    <div class="manage-tree-layout">
      <aside class="manage-tree-panel">
        <div class="manage-tree-panel__header">
          <span class="manage-tree-panel__title">部门</span>
          <div class="manage-tree-panel__actions">
            <el-button text circle @click="fetchDepts" title="刷新">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="manage-tree-panel__body">
          <div
            class="manage-nav-item"
            :class="{ 'is-active': !currentDeptId }"
            @click="clearDeptFilter"
          >
            <span class="manage-nav-item__title">全部用户</span>
          </div>

          <el-tree
            ref="deptTreeRef"
            :data="allDepts"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            highlight-current
            @node-click="handleNodeClick"
          />
        </div>
      </aside>

      <div class="manage-page">
        <!-- 查询区：条件 + 查询 / 重置 -->
        <section class="manage-filter">
          <el-input
            v-model="queryForm.nickname"
            class="manage-filter__control"
            clearable
            placeholder="昵称"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryForm.username"
            class="manage-filter__control"
            clearable
            placeholder="账号"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryForm.email"
            class="manage-filter__control"
            clearable
            placeholder="邮箱"
            @keyup.enter="handleSearch"
          />
          <div class="manage-filter__actions">
            <el-button type="primary" class="manage-primary-button" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button class="manage-secondary-button" @click="handleResetQuery">
              重置
            </el-button>
          </div>
        </section>

        <!-- 操作行：新建靠左 -->
        <header class="manage-page__hero">
          <div class="manage-page__actions is-start">
            <el-button type="primary" class="manage-primary-button" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新建用户
            </el-button>
          </div>
        </header>

        <section class="manage-surface manage-table">
          <div class="manage-surface__body">
            <el-table :data="userList" v-loading="loading" height="100%">
              <el-table-column label="昵称" min-width="200">
                <template #default="{ row }">
                  <div class="manage-entity">
                    <span class="manage-entity__text">
                      <span class="manage-entity__title">{{ row.nickname || '--' }}</span>
                    </span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="账号" min-width="160">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.username || '--' }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="邮箱" min-width="200">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.email || '--' }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="手机号" min-width="140">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.mobile || '--' }}</span>
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
                    <el-button text type="warning" @click="handleAssignRole(row)">分配角色</el-button>
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
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="formTitle"
      width="560px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="manage-form-grid">
        <el-form-item class="manage-form-grid__full" label="所属部门" prop="deptIds">
          <el-cascader
            v-model="form.deptIds"
            :options="allDepts"
            :props="{
              checkStrictly: true,
              value: 'id',
              label: 'name',
              children: 'children',
              emitPath: false,
              multiple: true
            }"
            placeholder="请选择所属部门"
            clearable
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>

        <el-form-item v-if="isCreate" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入登录密码" />
        </el-form-item>

        <el-form-item :class="{ 'manage-form-grid__full': !isCreate }" label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button class="manage-secondary-button" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="560px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleRoleDialogClosed"
    >
      <div class="manage-tree-card">
        <el-tree
          ref="roleTree"
          :data="allRoles"
          show-checkbox
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :props="{ label: 'roleName', children: 'children' }"
        />
      </div>

      <template #footer>
        <el-button class="manage-secondary-button" @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitAssignRole">保存分配</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from '@/network/manage/user'
import { getAllRoles } from '@/network/manage/role'
import { getTreeDepts } from '@/network/manage/dept'
import { assignRolesToUser, getRolesByUserId } from '@/network/manage/userRole'
import { formatDateTime } from './manage-utils'

const createDefaultForm = () => ({
  id: null,
  deptIds: [],
  nickname: '',
  username: '',
  password: '',
  email: '',
  mobile: ''
})

// 查询条件（空值不传给接口）
const createDefaultQuery = () => ({
  nickname: '',
  username: '',
  email: ''
})

const userList = ref([])
const loading = ref(false)
const allDepts = ref([])
const currentDeptId = ref(null)
const deptTreeRef = ref(null)
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)
const roleDialogVisible = ref(false)
const allRoles = ref([])
const currentUserRoles = ref([])
const currentUserId = ref(null)
const roleTree = ref(null)
const formRef = ref()
const form = reactive(createDefaultForm())
const queryForm = reactive(createDefaultQuery())

const rules = reactive({
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

const resetForm = () => {
  Object.assign(form, createDefaultForm())
}

// 组装列表查询参数：分页 + 部门 + 非空筛选
const buildListQuery = () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    deptId: currentDeptId.value
  }
  const nickname = String(queryForm.nickname || '').trim()
  const username = String(queryForm.username || '').trim()
  const email = String(queryForm.email || '').trim()

  if (nickname) {
    params.nickname = nickname
  }
  if (username) {
    params.username = username
  }
  if (email) {
    params.email = email
  }

  return params
}

const handleDialogClosed = () => {
  formRef.value?.clearValidate?.()
  resetForm()
}

const handleRoleDialogClosed = () => {
  currentUserRoles.value = []
  currentUserId.value = null
  roleTree.value?.setCheckedKeys?.([])
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
  fetchDepts()
  fetchUsers()
  fetchAllRoles()
})

const fetchDepts = async () => {
  try {
    const response = await getTreeDepts()
    allDepts.value = response.data || []
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
  }
}

const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await getAllUsers(buildListQuery())
    userList.value = response.data?.records || []
    total.value = response.data?.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchAllRoles = async () => {
  try {
    const response = await getAllRoles({ pageNum: 1, pageSize: 1000 })
    allRoles.value = response.data?.records || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const handleNodeClick = (data) => {
  currentDeptId.value = data.id
  currentPage.value = 1
  fetchUsers()
}

const clearDeptFilter = () => {
  currentDeptId.value = null
  currentPage.value = 1
  deptTreeRef.value?.setCurrentKey?.(null)
  fetchUsers()
}

// 查询：从第一页开始
const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

// 重置查询条件并刷新
const handleResetQuery = () => {
  Object.assign(queryForm, createDefaultQuery())
  currentPage.value = 1
  fetchUsers()
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchUsers()
}

const handleCreate = () => {
  resetForm()
  isCreate.value = true
  formTitle.value = '新建用户'

  if (currentDeptId.value) {
    form.deptIds = [currentDeptId.value]
  }

  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const response = await getUserById(row.id)
    resetForm()
    Object.assign(form, {
      ...createDefaultForm(),
      ...response.data,
      password: ''
    })
    isCreate.value = false
    formTitle.value = '编辑用户'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

const submitForm = async () => {
  const valid = await validateForm()

  if (!valid) {
    return
  }

  try {
    const payload = { ...form }

    if (isCreate.value) {
      await createUser(payload)
      ElMessage.success('创建用户成功')
    } else {
      delete payload.password
      await updateUser(payload)
      ElMessage.success('更新用户成功')
    }

    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该用户吗？', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUsers()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleAssignRole = async (row) => {
  currentUserId.value = row.id

  try {
    const response = await getRolesByUserId(row.id)
    currentUserRoles.value = response.data || []
    roleDialogVisible.value = true

    await nextTick()
    roleTree.value?.setCheckedKeys?.(currentUserRoles.value)
  } catch (error) {
    console.error('获取用户角色失败:', error)
    ElMessage.error('获取用户角色失败')
  }
}

const submitAssignRole = async () => {
  try {
    const checkedKeys = roleTree.value?.getCheckedKeys?.() || []
    await assignRolesToUser(currentUserId.value, checkedKeys)
    ElMessage.success('分配角色成功')
    roleDialogVisible.value = false
  } catch (error) {
    console.error('分配角色失败:', error)
    ElMessage.error('分配角色失败')
  }
}
</script>
