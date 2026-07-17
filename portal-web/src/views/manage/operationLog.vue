<template>
  <section class="manage-page">
    <!-- 查询区：条件 + 查询 / 重置 -->
    <section class="manage-filter">
      <el-input
        v-model="queryForm.keyword"
        class="manage-filter__control manage-filter__control--wide"
        clearable
        placeholder="描述 / URI / 参数"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="queryForm.operatorName"
        class="manage-filter__control"
        clearable
        placeholder="操作者"
        @keyup.enter="handleSearch"
      />
      <el-date-picker
        v-model="queryForm.timeRange"
        class="manage-filter__control manage-filter__control--range"
        type="datetimerange"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
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

    <section class="manage-surface manage-table">
      <div class="manage-surface__body">
        <el-table :data="logList" v-loading="loading" height="100%">
          <el-table-column label="操作者" width="160">
            <template #default="{ row }">
              <span>{{ row.operatorName || row.operatorId || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="模块" width="140">
            <template #default="{ row }">
              <span>{{ row.module || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <span>{{ row.type || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="描述" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.description || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="URI" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.requestUri || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="IP/地区" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.requestIp || '--' }}</span>
              <span v-if="row.requestRegion">（{{ row.requestRegion }}）</span>
            </template>
          </el-table-column>

          <el-table-column label="耗时" width="100" align="right">
            <template #default="{ row }">
              <span>{{ row.duration != null ? `${row.duration}ms` : '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.startTime || row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="right">
            <template #default="{ row }">
              <div class="manage-row-actions">
                <el-button text type="primary" @click="handleShowDetail(row)">详情</el-button>
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
      v-model="detailDialogVisible"
      title="日志详情"
      width="720px"
      class="manage-dialog"
      destroy-on-close
      @closed="handleDetailClosed"
    >
      <el-descriptions :column="2" border class="manage-descriptions">
        <el-descriptions-item label="操作者">
          {{ currentLog?.operatorName || currentLog?.operatorId || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="模块/类型">
          {{ currentLog?.module || '--' }} / {{ currentLog?.type || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="URI" :span="2">
          {{ currentLog?.requestUri || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP/地区" :span="2">
          {{ currentLog?.requestIp || '--' }}{{ currentLog?.requestRegion ? `（${currentLog.requestRegion}）` : '' }}
        </el-descriptions-item>
        <el-descriptions-item label="耗时">
          {{ currentLog?.duration != null ? `${currentLog.duration}ms` : '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="时间">
          {{ formatDateTime(currentLog?.startTime || currentLog?.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ currentLog?.description || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="参数" :span="2">
          <pre class="manage-pre">{{ currentLog?.params || '--' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="结果" :span="2">
          <pre class="manage-pre">{{ currentLog?.result || '--' }}</pre>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button class="manage-secondary-button" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { listOperationLogs } from '@/network/manage/operationLog'
import { formatDateTime } from './manage-utils'

// 查询条件（空值不传给接口）
const createDefaultQuery = () => ({
  keyword: '',
  operatorName: '',
  timeRange: [] as string[]
})

const loading = ref(false)
const logList = ref<any[]>([])
const queryForm = reactive(createDefaultQuery())
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const detailDialogVisible = ref(false)
const currentLog = ref<any | null>(null)

// 组装列表查询参数
const buildListQuery = () => {
  const params: Record<string, any> = {
    pageNum: currentPage.value,
    pageSize: pageSize.value
  }
  const keyword = String(queryForm.keyword || '').trim()
  const operatorName = String(queryForm.operatorName || '').trim()

  if (keyword) {
    params.keyword = keyword
  }
  if (operatorName) {
    params.operatorName = operatorName
  }
  if (queryForm.timeRange?.[0]) {
    params.startTimeFrom = queryForm.timeRange[0]
  }
  if (queryForm.timeRange?.[1]) {
    params.startTimeTo = queryForm.timeRange[1]
  }

  return params
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await listOperationLogs(buildListQuery())
    if (res.code === 200) {
      logList.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取操作日志失败')
    }
  } finally {
    loading.value = false
  }
}

// 查询：从第一页开始
const handleSearch = () => {
  currentPage.value = 1
  fetchLogs()
}

// 重置查询条件并刷新
const handleResetQuery = () => {
  Object.assign(queryForm, createDefaultQuery())
  currentPage.value = 1
  fetchLogs()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchLogs()
}

const handleShowDetail = (row: any) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

const handleDetailClosed = () => {
  currentLog.value = null
}

onMounted(() => {
  fetchLogs()
})
</script>
