<template>
  <section class="manage-page">
    <header class="manage-page__hero">
      <div class="manage-page__actions">
        <el-button class="manage-secondary-button" @click="fetchLogs">
          <el-icon><Refresh /></el-icon>
          刷新日志
        </el-button>
      </div>
    </header>

    <section class="manage-surface manage-table">
      <div class="manage-surface__header">
        <div class="manage-surface__header-title">
          <h2>操作日志</h2>
        </div>

        <div style="display:flex; gap: 10px; align-items:center; flex-wrap: wrap;">
          <el-input
            v-model="keyword"
            placeholder="搜索描述/URI/操作者/参数"
            clearable
            style="width: 280px;"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="operatorName"
            placeholder="操作者"
            clearable
            style="width: 180px;"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            @change="handleSearch"
          />
        </div>
      </div>

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

          <el-table-column label="描述" min-width="320" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.description || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="URI" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.requestUri || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="IP/地区" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.requestIp || '--' }}</span>
              <span v-if="row.requestRegion">（{{ row.requestRegion }}）</span>
            </template>
          </el-table-column>

          <el-table-column label="耗时" width="110" align="right">
            <template #default="{ row }">
              <span>{{ row.duration != null ? `${row.duration}ms` : '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.startTime || row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="right">
            <template #default="{ row }">
              <el-button text type="primary" @click="handleShowDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailDialogVisible" title="日志详情" width="860px" class="manage-dialog" destroy-on-close>
      <el-descriptions :column="2" border>
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
          {{ currentLog?.requestIp || '--' }} {{ currentLog?.requestRegion ? `（${currentLog.requestRegion}）` : '' }}
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
          <pre style="margin: 0; white-space: pre-wrap;">{{ currentLog?.params || '--' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="结果" :span="2">
          <pre style="margin: 0; white-space: pre-wrap;">{{ currentLog?.result || '--' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { listOperationLogs } from '@/network/manage/operationLog'
import { formatDateTime } from './manage-utils'

const loading = ref(false)
const logList = ref<any[]>([])
const keyword = ref('')
const operatorName = ref('')
const timeRange = ref<string[]>([])

const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)

const detailDialogVisible = ref(false)
const currentLog = ref<any | null>(null)

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await listOperationLogs({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      operatorName: operatorName.value || undefined,
      startTimeFrom: timeRange.value?.[0] || undefined,
      startTimeTo: timeRange.value?.[1] || undefined
    })
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

const handleSearch = () => {
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

onMounted(() => {
  fetchLogs()
})
</script>

