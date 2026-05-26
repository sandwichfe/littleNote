<template>
  <section class="manage-page">
    <div class="manage-tree-layout">
      <aside class="manage-tree-panel">
        <div class="manage-tree-panel__header">
          <div>
            <h2 class="manage-tree-panel__title">字典类型</h2>
          </div>

          <div class="manage-tree-panel__actions">
            <el-button text circle title="刷新" @click="fetchTypes">
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button text circle title="新建类型" @click="handleCreateType">
              <el-icon><Plus /></el-icon>
            </el-button>
            <el-button text circle title="删除类型" :disabled="!currentTypeId" @click="handleDeleteCurrentType">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="manage-tree-panel__body">
          <el-input
            v-model="typeKeyword"
            placeholder="搜索编码/名称"
            clearable
            style="margin-bottom: 10px;"
            @clear="fetchTypes"
            @keyup.enter="fetchTypes"
          />

          <el-table
            :data="typeList"
            v-loading="typeLoading"
            height="100%"
            highlight-current-row
            @current-change="handleTypeCurrentChange"
          >
            <el-table-column label="类型" min-width="220">
              <template #default="{ row }">
                <div class="manage-entity">
                  <span class="manage-entity__text">
                    <span class="manage-entity__title">{{ row.typeName }}</span>
                    <span class="manage-entity__subtitle">{{ row.typeCode }}</span>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="140" align="right">
              <template #default="{ row }">
                <div class="manage-row-actions">
                  <el-button text type="primary" @click.stop="handleEditType(row)">编辑</el-button>
                  <el-button text type="danger" @click.stop="handleDeleteType(row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </aside>

      <div class="manage-page">
        <header class="manage-page__hero">
          <div class="manage-page__actions">
            <el-button class="manage-secondary-button" @click="fetchItems" :disabled="!currentTypeId">
              <el-icon><Refresh /></el-icon>
              刷新字典项
            </el-button>
            <el-button
              type="primary"
              class="manage-primary-button"
              @click="handleCreateItem"
              :disabled="!currentTypeId"
            >
              <el-icon><Plus /></el-icon>
              新建字典项
            </el-button>
          </div>
        </header>

        <section class="manage-surface manage-table">
          <div class="manage-surface__header">
            <div class="manage-surface__header-title">
              <h2>{{ currentTypeName || '字典项列表' }}</h2>
            </div>
            <div style="display:flex; gap: 10px; align-items:center;">
              <el-input
                v-model="itemKeyword"
                placeholder="搜索标签/值"
                clearable
                style="width: 260px;"
                @clear="handleItemSearch"
                @keyup.enter="handleItemSearch"
              />
            </div>
          </div>

          <div class="manage-surface__body">
            <el-table :data="itemList" v-loading="itemLoading" height="100%">
              <el-table-column label="标签" min-width="220">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.label }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="值" min-width="180">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.value }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="排序" width="90">
                <template #default="{ row }">
                  <span>{{ row.sort ?? '--' }}</span>
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
                    <el-button text type="primary" @click="handleEditItem(row)">编辑</el-button>
                    <el-button text type="danger" @click="handleDeleteItem(row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="manage-pagination">
            <el-pagination
              :page-size="itemPageSize"
              :current-page="itemCurrentPage"
              layout="prev, pager, next"
              :total="itemTotal"
              @current-change="handleItemPageChange"
            />
          </div>
        </section>
      </div>
    </div>

    <el-dialog
      v-model="typeDialogVisible"
      :title="typeDialogTitle"
      width="640px"
      class="manage-dialog"
      destroy-on-close
    >
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-position="top" class="manage-form-grid">
        <el-form-item label="类型编码" prop="typeCode">
          <el-input v-model="typeForm.typeCode" placeholder="例如：user_status" :disabled="!typeIsCreate" />
        </el-form-item>
        <el-form-item label="类型名称" prop="typeName">
          <el-input v-model="typeForm.typeName" placeholder="例如：用户状态" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="typeForm.sort" :min="0" :max="999999" style="width: 100%;" />
        </el-form-item>
        <el-form-item class="manage-form-grid__full" label="备注" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="itemDialogVisible"
      :title="itemDialogTitle"
      width="660px"
      class="manage-dialog"
      destroy-on-close
    >
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-position="top" class="manage-form-grid">
        <el-form-item label="标签" prop="label">
          <el-input v-model="itemForm.label" placeholder="例如：启用" />
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model="itemForm.value" placeholder="例如：1" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="itemForm.sort" :min="0" :max="999999" style="width: 100%;" />
        </el-form-item>
        <el-form-item class="manage-form-grid__full" label="备注" prop="remark">
          <el-input v-model="itemForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitItem">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import {
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  listDictItems,
  listDictTypes,
  updateDictItem,
  updateDictType
} from '@/network/dict'
import { formatDateTime } from './manage-utils'

const typeList = ref<any[]>([])
const typeLoading = ref(false)
const typeKeyword = ref('')
const currentType = ref<any | null>(null)

const currentTypeId = computed(() => currentType.value?.id ?? null)
const currentTypeName = computed(() => currentType.value ? `${currentType.value.typeName}（${currentType.value.typeCode}）` : '')

const typeDialogVisible = ref(false)
const typeDialogTitle = ref('')
const typeIsCreate = ref(true)
const typeFormRef = ref()
const typeForm = reactive({
  id: null as number | null,
  typeCode: '',
  typeName: '',
  sort: 0 as number | null,
  remark: ''
})

const typeRules = {
  typeCode: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
  typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }]
}

const itemList = ref<any[]>([])
const itemLoading = ref(false)
const itemKeyword = ref('')
const itemPageSize = ref(10)
const itemCurrentPage = ref(1)
const itemTotal = ref(0)

const itemDialogVisible = ref(false)
const itemDialogTitle = ref('')
const itemIsCreate = ref(true)
const itemFormRef = ref()
const itemForm = reactive({
  id: null as number | null,
  dictTypeId: null as number | null,
  label: '',
  value: '',
  sort: 0 as number | null,
  remark: ''
})

const itemRules = {
  label: [{ required: true, message: '请输入标签', trigger: 'blur' }],
  value: [{ required: true, message: '请输入值', trigger: 'blur' }]
}

const resetTypeForm = () => {
  typeForm.id = null
  typeForm.typeCode = ''
  typeForm.typeName = ''
  typeForm.sort = 0
  typeForm.remark = ''
}

const resetItemForm = () => {
  itemForm.id = null
  itemForm.dictTypeId = currentTypeId.value
  itemForm.label = ''
  itemForm.value = ''
  itemForm.sort = 0
  itemForm.remark = ''
}

const fetchTypes = async () => {
  typeLoading.value = true
  try {
    const res = await listDictTypes({ pageNum: 1, pageSize: 200, keyword: typeKeyword.value || undefined })
    if (res.code === 200) {
      typeList.value = res.data?.records || []
      if (typeList.value.length > 0) {
        const stillExists = currentTypeId.value
          ? typeList.value.find(t => t.id === currentTypeId.value)
          : null
        currentType.value = stillExists || typeList.value[0]
      } else {
        currentType.value = null
      }
    } else {
      ElMessage.error(res.msg || '获取字典类型失败')
    }
  } finally {
    typeLoading.value = false
  }
}

const fetchItems = async () => {
  if (!currentTypeId.value) {
    itemList.value = []
    itemTotal.value = 0
    return
  }
  itemLoading.value = true
  try {
    const res = await listDictItems({
      pageNum: itemCurrentPage.value,
      pageSize: itemPageSize.value,
      dictTypeId: currentTypeId.value,
      keyword: itemKeyword.value || undefined
    })
    if (res.code === 200) {
      itemList.value = res.data?.records || []
      itemTotal.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取字典项失败')
    }
  } finally {
    itemLoading.value = false
  }
}

const handleTypeCurrentChange = (row: any) => {
  if (!row) return
  currentType.value = row
}

watch(currentTypeId, () => {
  itemCurrentPage.value = 1
  itemKeyword.value = ''
  fetchItems()
})

const handleCreateType = async () => {
  typeIsCreate.value = true
  typeDialogTitle.value = '新建字典类型'
  resetTypeForm()
  typeDialogVisible.value = true
  await nextTick()
  typeFormRef.value?.clearValidate?.()
}

const handleEditType = async (row: any) => {
  typeIsCreate.value = false
  typeDialogTitle.value = '编辑字典类型'
  typeForm.id = row.id
  typeForm.typeCode = row.typeCode
  typeForm.typeName = row.typeName
  typeForm.sort = row.sort ?? 0
  typeForm.remark = row.remark || ''
  typeDialogVisible.value = true
  await nextTick()
  typeFormRef.value?.clearValidate?.()
}

const submitType = async () => {
  await typeFormRef.value?.validate?.()
  const payload = {
    id: typeForm.id || undefined,
    typeCode: typeForm.typeCode,
    typeName: typeForm.typeName,
    sort: typeForm.sort ?? 0,
    remark: typeForm.remark || ''
  }
  const res = typeIsCreate.value ? await createDictType(payload as any) : await updateDictType(payload as any)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    typeDialogVisible.value = false
    await fetchTypes()
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

const handleDeleteType = async (row: any) => {
  await ElMessageBox.confirm(`确认删除字典类型「${row.typeName}」？此操作会同时删除其字典项。`, '提示', {
    type: 'warning'
  })
  const res = await deleteDictType(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await fetchTypes()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

const handleDeleteCurrentType = async () => {
  if (!currentType.value) return
  await handleDeleteType(currentType.value)
}

const handleCreateItem = async () => {
  if (!currentTypeId.value) return
  itemIsCreate.value = true
  itemDialogTitle.value = '新建字典项'
  resetItemForm()
  itemDialogVisible.value = true
  await nextTick()
  itemFormRef.value?.clearValidate?.()
}

const handleEditItem = async (row: any) => {
  itemIsCreate.value = false
  itemDialogTitle.value = '编辑字典项'
  itemForm.id = row.id
  itemForm.dictTypeId = row.dictTypeId
  itemForm.label = row.label
  itemForm.value = row.value
  itemForm.sort = row.sort ?? 0
  itemForm.remark = row.remark || ''
  itemDialogVisible.value = true
  await nextTick()
  itemFormRef.value?.clearValidate?.()
}

const submitItem = async () => {
  await itemFormRef.value?.validate?.()
  if (!currentTypeId.value) return
  const payload = {
    id: itemForm.id || undefined,
    dictTypeId: currentTypeId.value,
    label: itemForm.label,
    value: itemForm.value,
    sort: itemForm.sort ?? 0,
    remark: itemForm.remark || ''
  }
  const res = itemIsCreate.value ? await createDictItem(payload as any) : await updateDictItem(payload as any)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    itemDialogVisible.value = false
    await fetchItems()
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

const handleDeleteItem = async (row: any) => {
  await ElMessageBox.confirm(`确认删除字典项「${row.label}」？`, '提示', { type: 'warning' })
  const res = await deleteDictItem(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await fetchItems()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

const handleItemSearch = () => {
  itemCurrentPage.value = 1
  fetchItems()
}

const handleItemPageChange = (page: number) => {
  itemCurrentPage.value = page
  fetchItems()
}

onMounted(async () => {
  await fetchTypes()
})
</script>
