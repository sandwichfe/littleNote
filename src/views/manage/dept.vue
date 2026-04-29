<template>
  <section class="manage-page">
    <header class="manage-page__hero">
      <div class="manage-page__hero-copy">
        <p class="manage-page__eyebrow">Organization Structure</p>
        <h1 class="manage-page__hero-title">部门架构</h1>
        <p class="manage-page__hero-description">
          维护组织树、负责人和联系方式，让成员归属、协作路径和管理权限都更清晰。
        </p>
      </div>

      <div class="manage-page__actions">
        <div class="manage-page__hint">
          <span class="manage-page__hint-label">组织节点</span>
          <span class="manage-page__hint-value">{{ totalDeptCount }}</span>
        </div>

        <el-button class="manage-secondary-button" @click="fetchDepts">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>

        <el-button type="primary" class="manage-primary-button" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建部门
        </el-button>
      </div>
    </header>

    <section class="manage-page__stats">
      <article class="manage-stat-card">
        <div class="manage-stat-card__icon is-accent">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="manage-stat-card__body">
          <span class="manage-stat-card__label">全部部门</span>
          <span class="manage-stat-card__value">{{ totalDeptCount }}</span>
          <span class="manage-stat-card__note">包含所有层级的组织节点。</span>
        </div>
      </article>

      <article class="manage-stat-card">
        <div class="manage-stat-card__icon is-success">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="manage-stat-card__body">
          <span class="manage-stat-card__label">正常状态</span>
          <span class="manage-stat-card__value">{{ activeDeptCount }}</span>
          <span class="manage-stat-card__note">当前可正常使用的部门节点。</span>
        </div>
      </article>

      <article class="manage-stat-card">
        <div class="manage-stat-card__icon is-warm">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="manage-stat-card__body">
          <span class="manage-stat-card__label">停用部门</span>
          <span class="manage-stat-card__value">{{ disabledDeptCount }}</span>
          <span class="manage-stat-card__note">建议定期核对停用组织是否仍保留必要。</span>
        </div>
      </article>

      <article class="manage-stat-card">
        <div class="manage-stat-card__icon is-slate">
          <el-icon><User /></el-icon>
        </div>
        <div class="manage-stat-card__body">
          <span class="manage-stat-card__label">已配负责人</span>
          <span class="manage-stat-card__value">{{ assignedLeaderCount }}</span>
          <span class="manage-stat-card__note">部门负责人已填写的节点数量。</span>
        </div>
      </article>
    </section>

    <section class="manage-surface manage-table">
      <div class="manage-surface__header">
        <div class="manage-surface__header-title">
          <h2>部门列表</h2>
          <p>树形视图展示组织层级，支持直接维护负责人、联系方式和启停状态。</p>
        </div>

        <div class="manage-surface__header-side">
          <span class="manage-pill">根部门 <strong>{{ rootDeptCount }}</strong></span>
          <span class="manage-pill">已配置邮箱 <strong>{{ emailReadyCount }}</strong></span>
        </div>
      </div>

      <div class="manage-surface__body">
        <el-table
          :data="deptList"
          v-loading="loading"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <el-table-column label="部门信息" min-width="260">
            <template #default="{ row }">
              <div class="manage-entity">
                <span class="manage-entity__avatar">
                  <el-icon><OfficeBuilding /></el-icon>
                </span>

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
                <span>{{ row.leader || '--' }}</span>
                <span class="manage-muted-text">组织对接人</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="联系电话" min-width="150">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span>{{ row.phone || '--' }}</span>
                <span class="manage-muted-text">部门沟通入口</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="邮箱" min-width="210">
            <template #default="{ row }">
              <div class="manage-subtle-stack">
                <span>{{ row.email || '--' }}</span>
                <span class="manage-muted-text">业务通知与归档</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status ? 'danger' : 'success'" effect="light" round>
                {{ row.status ? '停用' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitForm">保存部门</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck,
  OfficeBuilding,
  Plus,
  Refresh,
  User,
  WarningFilled
} from '@element-plus/icons-vue'
import { createDept, deleteDept, getDeptById, getTreeDepts, updateDept } from '@/network/dept'
import { countTreeNodes, formatDateTime } from './manage-utils'

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

const deptList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const formTitle = ref('')
const isCreate = ref(true)
const allDepts = ref([])
const formRef = ref()
const form = reactive(createDefaultForm())

const rules = reactive({
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入显示排序', trigger: 'change' }]
})

const countMatchingNodes = (nodes, predicate) => (
  nodes.reduce(
    (total, node) => total + (predicate(node) ? 1 : 0) + countMatchingNodes(node.children || [], predicate),
    0
  )
)

const totalDeptCount = computed(() => countTreeNodes(deptList.value))
const activeDeptCount = computed(() => countMatchingNodes(deptList.value, node => !node.status))
const disabledDeptCount = computed(() => countMatchingNodes(deptList.value, node => Boolean(node.status)))
const assignedLeaderCount = computed(() => countMatchingNodes(deptList.value, node => Boolean(node.leader)))
const emailReadyCount = computed(() => countMatchingNodes(deptList.value, node => Boolean(node.email)))
const rootDeptCount = computed(() => deptList.value.length)

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

onMounted(() => {
  fetchDepts()
})

const fetchDepts = async () => {
  try {
    loading.value = true
    const response = await getTreeDepts()
    deptList.value = response.data || []
    allDepts.value = response.data || []
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
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
