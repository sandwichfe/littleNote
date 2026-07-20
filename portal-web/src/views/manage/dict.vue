<template>
  <section class="manage-page">
    <div class="manage-tree-layout">
      <aside class="manage-tree-panel">
        <div class="manage-tree-panel__header">
          <span class="manage-tree-panel__title">字典类型</span>
          <div class="manage-tree-panel__actions">
            <el-button text circle title="新建类型" @click="handleCreateType">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 类型筛选：输入实时搜索（防抖） -->
        <section class="manage-filter manage-filter--stack">
          <el-input
            v-model="typeQuery.keyword"
            class="manage-filter__control manage-filter__control--fill"
            clearable
            placeholder="编码 / 名称"
          />
        </section>

        <div class="manage-tree-panel__body">
          <el-table
            :data="typeList"
            v-loading="typeLoading"
            height="100%"
            highlight-current-row
            @current-change="handleTypeCurrentChange"
          >
            <el-table-column label="类型" min-width="160">
              <template #default="{ row }">
                <div class="manage-entity">
                  <span class="manage-entity__text">
                    <!-- 单行展示：名称（编码） -->
                    <span class="manage-entity__title">{{ row.typeName }}（{{ row.typeCode || '--' }}）</span>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120" align="right">
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
        <!-- 字典项查询 -->
        <section class="manage-filter">
          <el-input
            v-model="itemQuery.keyword"
            class="manage-filter__control"
            clearable
            placeholder="标签 / 值"
            :disabled="!currentTypeId"
            @keyup.enter="handleItemSearch"
          />
          <div class="manage-filter__actions">
            <el-button
              type="primary"
              class="manage-primary-button"
              :disabled="!currentTypeId"
              @click="handleItemSearch"
            >
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button
              class="manage-secondary-button"
              :disabled="!currentTypeId"
              @click="handleItemReset"
            >
              重置
            </el-button>
          </div>
        </section>

        <!-- 操作行：新建靠左 -->
        <header class="manage-page__hero">
          <div class="manage-page__actions is-start">
            <el-button
              type="primary"
              class="manage-primary-button"
              :disabled="!currentTypeId"
              @click="handleCreateItem"
            >
              <el-icon><Plus /></el-icon>
              新建字典项
            </el-button>
          </div>
        </header>

        <section class="manage-surface manage-table">
          <div class="manage-surface__body">
            <el-table :data="itemList" v-loading="itemLoading" height="100%">
              <el-table-column label="标签" min-width="200">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.label || '--' }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="值" min-width="160">
                <template #default="{ row }">
                  <div class="manage-subtle-stack">
                    <span>{{ row.value || '--' }}</span>
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

              <el-table-column label="操作" width="180" align="right">
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
      width="560px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleTypeDialogClosed"
    >
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-position="top" class="manage-form-grid">
        <el-form-item label="类型编码" prop="typeCode">
          <el-input v-model="typeForm.typeCode" placeholder="例如：user_status" :disabled="!typeIsCreate" />
        </el-form-item>
        <el-form-item label="类型名称" prop="typeName">
          <el-input v-model="typeForm.typeName" placeholder="例如：用户状态" />
        </el-form-item>
        <el-form-item class="manage-form-grid__full" label="排序" prop="sort">
          <el-input-number v-model="typeForm.sort" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item class="manage-form-grid__full" label="备注" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button class="manage-secondary-button" @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="itemDialogVisible"
      :title="itemDialogTitle"
      width="560px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleItemDialogClosed"
    >
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-position="top" class="manage-form-grid">
        <el-form-item label="标签" prop="label">
          <el-input v-model="itemForm.label" placeholder="例如：启用" />
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model="itemForm.value" placeholder="例如：1" />
        </el-form-item>
        <el-form-item class="manage-form-grid__full" label="排序" prop="sort">
          <el-input-number v-model="itemForm.sort" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item class="manage-form-grid__full" label="备注" prop="remark">
          <el-input v-model="itemForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button class="manage-secondary-button" @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" class="manage-primary-button" @click="submitItem">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  listDictItems,
  listDictTypes,
  updateDictItem,
  updateDictType
} from '@/network/manage/dict'
import { formatDateTime } from './manage-utils'

const typeList = ref<any[]>([])
const typeLoading = ref(false)
const currentType = ref<any | null>(null)
const typeQuery = reactive({ keyword: '' })

const currentTypeId = computed(() => currentType.value?.id ?? null)

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
const itemQuery = reactive({ keyword: '' })
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

const handleTypeDialogClosed = () => {
  typeFormRef.value?.clearValidate?.()
  resetTypeForm()
}

const handleItemDialogClosed = () => {
  itemFormRef.value?.clearValidate?.()
  resetItemForm()
}

const fetchTypes = async () => {
  typeLoading.value = true
  try {
    const keyword = String(typeQuery.keyword || '').trim()
    const res = await listDictTypes({
      pageNum: 1,
      pageSize: 200,
      keyword: keyword || undefined
    })
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
    const keyword = String(itemQuery.keyword || '').trim()
    const res = await listDictItems({
      pageNum: itemCurrentPage.value,
      pageSize: itemPageSize.value,
      dictTypeId: currentTypeId.value,
      keyword: keyword || undefined
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

// 切换类型时重置字典项查询并刷新
watch(currentTypeId, () => {
  itemCurrentPage.value = 1
  itemQuery.keyword = ''
  fetchItems()
})

// 类型关键字防抖搜索
let typeSearchTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => typeQuery.keyword,
  () => {
    if (typeSearchTimer) clearTimeout(typeSearchTimer)
    typeSearchTimer = setTimeout(() => {
      fetchTypes()
    }, 300)
  }
)

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

const handleItemReset = () => {
  itemQuery.keyword = ''
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
