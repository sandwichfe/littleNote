<template>
  <section class="manage-page">
    <!-- 查询区：常用条件 + 查询按钮 -->
    <section class="manage-filter">
      <el-input
        v-model="queryForm.name"
        class="manage-filter__control"
        clearable
        placeholder="部门名称"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="queryForm.leader"
        class="manage-filter__control"
        clearable
        placeholder="负责人"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="queryForm.status"
        class="manage-filter__control manage-filter__control--status"
        clearable
        placeholder="状态"
      >
        <el-option label="正常" :value="false" />
        <el-option label="停用" :value="true" />
      </el-select>
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
          新建部门
        </el-button>
      </div>
    </header>

    <!-- 列表表面 -->
    <section class="manage-surface manage-table">
      <div class="manage-surface__body">
        <el-table
          :data="deptList"
          v-loading="loading"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          height="100%"
        >
          <el-table-column label="部门信息" min-width="260" class-name="manage-tree-column">
            <template #default="{ row }">
              <div class="manage-entity">
                <span class="manage-entity__text">
                  <span class="manage-entity__title">{{ row.name }}</span>
                  <span class="manage-entity__meta">排序 {{ row.sort ?? 0 }}</span>
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="负责人" min-width="160">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span :class="{ 'manage-muted-text': !row.leader }">{{ row.leader || '未指定' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="联系电话" min-width="150">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span :class="{ 'manage-muted-text': !row.phone }">{{ row.phone || '—' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="邮箱" min-width="210">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span :class="{ 'manage-muted-text': !row.email }">{{ row.email || '—' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <span
                class="manage-status"
                :class="row.status ? 'is-danger' : 'is-success'"
              >
                {{ row.status ? '停用' : '正常' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              <span class="manage-muted-text">{{ formatDateTime(row.createTime) }}</span>
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
        <el-form-item class="manage-form-grid__full" label="上级部门" prop="parentId">
          <el-cascader
            v-model="form.parentId"
            :options="allDepts"
            :props="{
              checkStrictly: true,
              value: 'id',
              label: 'name',
              children: 'children',
              emitPath: false
            }"
            placeholder="请选择上级部门"
            clearable
            @visible-change="handleCascaderVisibleChange"
          />
        </el-form-item>

        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>

        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
        </el-form-item>

        <el-form-item label="负责人" prop="leader">
          <el-input v-model="form.leader" placeholder="请输入负责人姓名" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item class="manage-form-grid__full" label="部门状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="false">正常</el-radio>
            <el-radio :label="true">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button class="manage-secondary-button" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitForm">保存部门</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { createDept, deleteDept, getDeptById, getTreeDepts, updateDept } from '@/network/manage/dept'
import { formatDateTime } from './manage-utils'

const createDefaultForm = () => ({
  id: null,
  parentId: null,
  name: '',
  sort: 0,
  leader: '',
  phone: '',
  email: '',
  status: false
})

// 查询条件
const createDefaultQuery = () => ({
  name: '',
  leader: '',
  status: undefined
})

const deptList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)
const allDepts = ref([])
const formRef = ref()
const form = reactive(createDefaultForm())
const queryForm = reactive(createDefaultQuery())

const rules = reactive({
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入显示排序', trigger: 'change' }]
})

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

// 组装树查询参数（空值不传）
const buildTreeQuery = () => {
  const params = {}
  const name = String(queryForm.name || '').trim()
  const leader = String(queryForm.leader || '').trim()

  if (name) {
    params.name = name
  }
  if (leader) {
    params.leader = leader
  }
  if (queryForm.status !== undefined && queryForm.status !== null && queryForm.status !== '') {
    params.status = queryForm.status
  }

  return params
}

onMounted(() => {
  fetchDepts()
})

// 列表查询（带筛选参数）
const fetchDepts = async () => {
  try {
    loading.value = true
    const response = await getTreeDepts(buildTreeQuery())
    deptList.value = response.data || []
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  fetchDepts()
}

// 重置查询
const handleResetQuery = () => {
  Object.assign(queryForm, createDefaultQuery())
  fetchDepts()
}

const handleCreate = () => {
  resetForm()
  isCreate.value = true
  formTitle.value = '新建部门'
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const response = await getDeptById(row.id)
    resetForm()
    Object.assign(form, {
      ...createDefaultForm(),
      ...response.data,
      status: Boolean(response.data?.status)
    })
    isCreate.value = false
    formTitle.value = '编辑部门'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取部门信息失败:', error)
    ElMessage.error('获取部门信息失败')
  }
}

const submitForm = async () => {
  const valid = await validateForm()

  if (!valid) {
    return
  }

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

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该部门吗？', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDept(row.id)
      ElMessage.success('删除成功')
      fetchDepts()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 上级部门级联：始终拉完整树，不受列表筛选影响
const handleCascaderVisibleChange = async (visible) => {
  if (!visible) {
    return
  }

  try {
    const response = await getTreeDepts()
    allDepts.value = response.data || []
  } catch (error) {
    console.error('获取部门树失败:', error)
  }
}
</script>
