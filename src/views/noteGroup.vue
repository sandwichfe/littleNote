<template>
  <div class="main_content">
    <div class="top-box">
      <div class="filter-container">
        <!-- 搜索框 -->
        <div class="filter-item search-box">
          <el-input v-model="searchValue" placeholder="搜索标签" ref="keywordSelect" size="large" clearable>
            <template #prefix>
              <svg-icon iconClass="search" className="search-icon" />
            </template>
          </el-input>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="add-btn" @click="handleAdd">
        <svg-icon iconClass="add" className="add-btn-svg" />
      </div>
    </div>

    <!-- 标签列表 -->
    <div ref="scrollContainer" :style="{ height: scrollerHeight }" class="scroll_content" v-loading="loading"
      element-loading-text="o(*≧▽≦)ツ加载中~">
      <div v-if="noteGroups && noteGroups.length > 0">
        <el-table :data="noteGroups" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="groupName" label="标签名称" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty description="(ง •̀_•́)ง没有数据了" v-else image="" :image-size="200" class="empty-msg-box"></el-empty>

      <!-- 添加/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '添加标签' : '编辑标签'" width="500">
        <el-form :model="form" label-width="80px">
          <el-form-item label="标签名称">
            <el-input v-model="form.groupName" placeholder="请输入标签名称"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 删除确认框 -->
      <el-dialog v-model="deleteDialogVisible" title="删除标签" width="500" center>
        <span>确定删除该标签吗？</span>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="deleteDialogVisible = false">取消</el-button>
            <el-button type="danger" @click="confirmDelete">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<!-- 声明导出组件名 -->
<script lang="ts">
export default {
  name: "noteGroup",
}
</script>

<!-- setup语法糖 -->
<script setup lang="ts">
import { listNoteGroup, addNoteGroup, editNoteGroup, getNoteGroup, deleteNoteGroup, type NoteGroup } from "@/network/noteGroup";
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// 定义响应式变量
const noteGroups = ref<NoteGroup[]>([]);
const loading = ref(false);
const searchValue = ref("");
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const dialogType = ref<'add' | 'edit'>('add');
const currentId = ref<number | null>(null);

// 表单数据
const form = ref({
  groupName: ''
});

// 计算属性
const scrollerHeight = computed(() => {
  return (document.documentElement.clientHeight - 70 - 10) + 'px';
});

// 监听搜索输入
watch(searchValue, (newValue) => {
  delay(() => {
    searchGroups(newValue);
  }, 300);
});

// 节流函数
const delay = (function () {
  let timer: ReturnType<typeof setTimeout>;
  return function (callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

// 初始化数据
onMounted(() => {
  loadData();
});

// 加载数据
const loadData = () => {
  loading.value = true;
  listNoteGroup(-1, -1).then((res) => {
    noteGroups.value = res.data.records;
  }).catch(error => {
    console.error('Failed to load note groups:', error);
    ElMessage.error('加载标签失败');
  }).finally(() => {
    loading.value = false;
  });
};

// 搜索标签
const searchGroups = (query) => {
  loading.value = true;
  listNoteGroup(-1, -1).then((res) => {
    if (query) {
      noteGroups.value = res.data.records.filter(group => 
        group.groupName.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      noteGroups.value = res.data.records;
    }
  }).finally(() => {
    loading.value = false;
  });
};

// 添加标签
const handleAdd = () => {
  dialogType.value = 'add';
  form.value = { groupName: '' };
  dialogVisible.value = true;
};

// 编辑标签
const handleEdit = (row) => {
  dialogType.value = 'edit';
  currentId.value = row.id;
  form.value = { groupName: row.groupName };
  dialogVisible.value = true;
};

// 删除标签
const handleDelete = (row) => {
  currentId.value = row.id;
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = () => {
  if (currentId.value) {
    loading.value = true;
    deleteNoteGroup(currentId.value).then(() => {
      ElMessage.success('删除成功');
      loadData();
      deleteDialogVisible.value = false;
    }).catch(error => {
      console.error('Failed to delete note group:', error);
      ElMessage.error('删除失败');
    }).finally(() => {
      loading.value = false;
    });
  }
};

// 提交表单
const submitForm = () => {
  if (!form.value.groupName) {
    ElMessage.warning('请输入标签名称');
    return;
  }

  loading.value = true;
  if (dialogType.value === 'add') {
    // 添加标签
    addNoteGroup(form.value.groupName).then(() => {
      ElMessage.success('添加成功');
      dialogVisible.value = false;
      loadData();
    }).catch(error => {
      console.error('Failed to add note group:', error);
      ElMessage.error('添加失败');
    }).finally(() => {
      loading.value = false;
    });
  } else {
    // 编辑标签
    if (currentId.value) {
      editNoteGroup(currentId.value, form.value.groupName).then(() => {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadData();
      }).catch(error => {
        console.error('Failed to update note group:', error);
        ElMessage.error('更新失败');
      }).finally(() => {
        loading.value = false;
      });
    }
  }
};
</script>

<style scoped>
.main_content {
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: #f4f6f8;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.top-box {
  background: #fff;
  display: flex;
  word-break: keep-all;
  white-space: nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.filter-item {
  transition: all 0.3s ease;
  width: 180px;
  flex-shrink: 0;
}

.search-box {
  flex: 1;
  min-width: 100px;
  margin-right: 10px;
}

.filter-icon,
.search-icon {
  color: #909399;
  margin-right: 5px;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  width: 50px;
  flex-shrink: 0;
}

@keyframes rotateEffect {
  0% {
    transform: rotate(0deg) scale(1);
  }

  33% {
    transform: rotate(-7.5deg) scale(1.1);
  }

  66% {
    transform: rotate(7.5deg) scale(1.1);
  }

  100% {
    transform: rotate(0deg) scale(1.1);
  }
}

.add-btn:hover {
  animation: rotateEffect 0.8s ease forwards;
}

.scroll_content {
  padding: 20px;
  overflow-y: auto;
}

.empty-msg-box {
  margin-top: 50px;
}
</style>