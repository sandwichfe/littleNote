<template>
  <div class="main_content">



    <div class="top-box">
      <div class="filter-container">
        <!-- 分组筛选 -->
        <div class="filter-item">
          <el-select v-model="queryParams.groupId" placeholder="类型" size="large" clearable
            @change="changeGroup" @clear="handleClear">
            <template #prefix>
              <svg-icon iconClass="filter" className="filter-icon" />
            </template>
            <el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" />
          </el-select>
        </div>

        <!-- 搜索框移到顶部 -->
        <div class="filter-item search-box">
          <el-input v-model="queryParams.keyword" placeholder="搜索笔记" ref="keywordSelect" size="large" clearable>
            <template #prefix>
              <svg-icon iconClass="search" className="search-icon" />
            </template>
          </el-input>
        </div>
      </div>

      <!-- 添加 -->
      <div class="add-btn" @click="addOrUpdateNote(-1)">
        <svg-icon iconClass="add" className="add-btn-svg" />
      </div>

    </div>

    <!-- 列表 -->
    <div ref="scrollContainer" :style="{ height: scrollerHeight }" class="scroll_content" v-loading="loading"
      element-loading-text="o(*≧▽≦)ツ加载中~">
      <div v-if="contents && contents.length > 0">
        <ul>
          <li v-for="(c, index) in contents" :key="index" class="line" @mousedown="startTimer()" @mouseup="clearTimer">
            <div class="file-li-item" @click="addOrUpdateNote(c.id)">
              <div class="prename">{{ c.title }}</div>
              <div class="ptime">{{ c.updateTime || c.createTime }}</div>
            </div>
          </li>
        </ul>
      </div>

      <el-empty description="(ง •̀_•́)ง没有数据了" v-else image="" :image-size="200" class="empty-msg-box"></el-empty>

      <!-- 确认框 -->
      <el-dialog v-model="centerDialogVisible" title="删除" width="500" center>
        <span>确定删除？</span>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="centerDialogVisible = false">Cancel</el-button>
            <el-button @click="centerDialogVisible = false">Confirm</el-button>
          </div>
        </template>
      </el-dialog>
    </div>

  </div>
</template>

<!-- 声明导出组件名 -->
<script lang="ts">
export default {
  name: "note",
}
</script>

<!-- setup语法糖 -->
<script setup lang="ts">
import { listNote, type Note } from "@/network/base"; // 引入自己封装的axios请求函数
import { listNoteGroup } from "@/network/noteGroup";
import { ref, computed, watch, onMounted, onActivated, onDeactivated, nextTick, reactive } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useScrollStore } from "@/store/scroll"; // 引入滚动位置 Pinia store
import { useNoteGroupStore } from "@/store/noteGroup"; // 引入笔记分组 Pinia store

// 定义查询对象接口
interface QueryParams {
  groupId: number | null;
  keyword: string;
}

// 引入 Pinia store
const scrollStore = useScrollStore();
const noteGroupStore = useNoteGroupStore();

// 创建响应式查询对象
const queryParams = reactive<QueryParams>({
  groupId: null,
  keyword: ''
});

// 监听查询参数变化
watch(() => [queryParams.groupId, queryParams.keyword], () => {
  // 当查询参数变化时，延迟加载数据
  delay(() => {
    loadNotesByQuery();
  }, 300);
}, { deep: true });

const groups = ref(
  [
    {
      id: 1,
      groupName: 'Option1',
    },
  ]
)

// 处理选中项变化
const changeGroup = (newValue: number| null) => {
  // 保存选中的分组ID到pinia
  noteGroupStore.updateSelectedGroupId(newValue);
  // queryParams.groupId 已通过 v-model 自动更新
  // 查询参数变化会触发watch，自动加载数据
};

// 定义一个 ref 用于引用 DOM 元素  绑定dom的ref
const scrollContainer = ref<HTMLElement | null>(null);


// 设置滚动条到指定位置
const scrollToPosition = (position) => {
  console.log('尝试设置滚动条位置:', position);
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = position;
  }
};

// 保存滚动条位置
const saveScrollPosition = () => {
  if (scrollContainer.value) {
    const scrollTop = scrollContainer.value.scrollTop;
    console.log('保存滚动条位置:', scrollTop);
    scrollStore.updateScrollPosition(scrollTop);
    return true;
  } else {
    console.warn('scrollContainer未找到，无法保存滚动位置');
    return false;
  }
};

// 恢复滚动条位置
const restoreScrollPosition = (delay = 100) => {
  const savedScrollPosition = scrollStore.scrollPosition;
  if (savedScrollPosition) {
    setTimeout(() => {
      scrollToPosition(savedScrollPosition);
    }, delay);
    return true;
  }
  return false;
};


// 节流函数
const delay = (function () {
  let timer: ReturnType<typeof setTimeout>; 
  return function (callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

const router = useRouter(); // Vue 3 使用 `useRouter` 钩子进行路由跳转
let timer;

// 定义响应式变量
const centerDialogVisible = ref(false);
const contents = ref<Note[]>([]);
const loading = ref(false);
const backTopVisible = ref(false);
// searchValue已在上方定义


// 计算属性
const scrollerHeight = computed(() => {
  return (document.documentElement.clientHeight - 70 -10  ) + 'px';
});

// 搜索框输入直接绑定到queryParams.keyword
// queryParams的变化会通过之前设置的watch触发数据加载

onMounted(() => {
  initList();
  
  // 在页面首次加载时恢复滚动位置
  nextTick(() => {
    restoreScrollPosition(200);
  });
});

onBeforeRouteLeave((to, from, next) => {
  // 路由离开时保存滚动条位置
  saveScrollPosition();
  
  // 路由离开时保存当前选中的分组ID
  // 无论queryParams.groupId是否有值，都更新pinia中的状态  如果有值，保存该值；如果无值，则重置为空字符串
  if (queryParams.groupId) {
    noteGroupStore.updateSelectedGroupId(queryParams.groupId);
  } else {
    noteGroupStore.resetSelectedGroupId();
  }
  
  next();
});


// 处理清除选择事件
const handleClear = () => {
  // 重置pinia中保存的分组ID
  noteGroupStore.resetSelectedGroupId();
  // queryParams.groupId 已通过 v-model 自动更新为null
  // 查询参数变化会触发watch，自动加载数据
};

// 加载笔记分组数据
const loadNoteGroups = async () => {
  try {
    const groupRes = await listNoteGroup(-1, -1);
    groups.value = groupRes.data.records;
  } catch (error) {
    console.error('Failed to load note groups:', error);
  }
};

// 根据当前分组列表选择合适的分组
const selectGroup = () => {
  if (!groups.value || groups.value.length === 0) {
    return null;
  }
  
   let storeSaveId =  noteGroupStore.selectedGroupId

  // 如果pinia中有保存的分组ID，则使用它
  if (storeSaveId) {
    // 检查保存的分组ID是否在当前分组列表中
    const groupExists = groups.value.some(group => group.id === storeSaveId);
    // 如果保存的分组ID不在当前列表中， 就是手动设置为-1的情况 此时不需要根据下拉查询
      if(groupExists){
        queryParams.groupId =storeSaveId;
        // 手动设置为-1的情况 不需要根据下拉查询 
      }else if(storeSaveId === -1){
        queryParams.groupId = null;
        // 情况默认取第一个
      }else if(storeSaveId === null){
        queryParams.groupId = groups.value[0].id;
      }
  } else {
    // 如果pinia中没有保存的分组ID（为空字符串），则
    queryParams.groupId = Number(groups.value[0].id);
  }
};

// 根据查询对象加载笔记数据
const loadNotesByQuery = async () => {
  loading.value = true;
  try {
    // 使用查询对象中的参数
    await loadNotes(queryParams.groupId, queryParams.keyword);
  } catch (error) {
    console.error('Failed to load notes by query:', error);
  } finally {
    loading.value = false;
  }
};

// 加载笔记数据
const loadNotes = async (groupId = null, keyword = '') => {
  try {
    // 这里可以扩展API，添加keyword参数用于后端搜索
    // 目前仅使用groupId进行筛选
    const noteRes = await listNote(-1, -1, groupId,keyword);
    
    // 如果有关键词，在前端进行过滤
    if (keyword && keyword.trim() !== '') {
      const lowerKeyword = keyword.toLowerCase();
      contents.value = noteRes.data.records.filter(note => 
        note.title.toLowerCase().includes(lowerKeyword)
      );
    } else {
      contents.value = noteRes.data.records;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to load notes:', error);
    return false;
  }
};

// 初始化列表数据
const initList = async () => {
  loading.value = true;
  try {
    // 1. 加载分组数据
    await loadNoteGroups();
    
    // 2. 获取当前选中分组id并更新查询对象
    selectGroup();
    
    // 3. 使用查询对象加载笔记数据
    // 这里不使用watch触发的自动加载，因为初始化时需要确保顺序执行
    await loadNotes(queryParams.groupId, queryParams.keyword);
  } catch (error) {
    console.error('Failed to initialize data:', error);
  } finally {
    loading.value = false;
  }
};

// 启动定时器
const startTimer = () => {
  timer = setTimeout(() => {
    centerDialogVisible.value = true;
  }, 1000);
};

// 清除定时器
const clearTimer = () => {
  clearTimeout(timer);
};

// 添加或更新笔记 
const addOrUpdateNote = (id) => {
  router.push(`/noteDetail/${id}`);
};
</script>

<style scoped>
.main_content {
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: #f4f6f8; /* Light gray background for a softer look */
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Softer shadow */
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
  width: 180px; /* 固定宽度 */
  flex-shrink: 0; /* 防止压缩 */
}

.filter-item .el-select {
  width: 100%; /* 使select填满filter-item */
}

.search-box {
  flex: 1; /* 占据剩余空间 */
  min-width: 100px; /* 最小宽度 */
  margin-right: 10px;
}

.filter-icon, .search-icon {
  color: #909399;
  margin-right: 5px;
}

.top-box div {
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  width: 50px; /* 固定宽度 */
  flex-shrink: 0; /* 防止压缩 */
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

.el-select {
  transition: box-shadow 0.3s ease; /* Add transition for select focus */
}

.el-select:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); /* Element Plus like focus ring */
}

.keyword-serach {
  background-color: #ffffff; /* White background for header */
  border-radius: 10px;
}

.keyword-serach .el-input__inner {
  border-radius: 6px; /* Rounded input field */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.keyword-serach .el-input__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.keyword-serach .el-input {
  transition: box-shadow 0.3s ease; /* Add transition for input focus */
}

.keyword-serach .el-input:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); /* Element Plus like focus ring */
}

.scroll_content {
  overflow-y: auto;
  border: 1px solid #e0e0e0; /* Lighter border */
  background-color: #ffffff; /* White background for content area */
  border-bottom: none;
  border-radius: 0 0 8px 8px;
  padding: 10px;
}

ul {
  margin-left: 10px;
  margin-right: 10px;
  list-style: none;
  display: flex;
  flex-direction: column; /* 改为纵向排列 */
  padding: 0; /* Remove default padding */
  width: 100%; /* 确保宽度为100% */
}

ul>i {
  width: 10rem; /* Consider making this responsive or removing if not needed */
}

.line {
  background-color: #fff;
  border-radius: 8px;
  margin-top: 8px; /* Increased margin */
  margin-bottom: 8px; /* Increased margin */
  width: 100%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Subtle shadow for list items */
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* Smooth transition for hover */
  opacity: 0;
  animation: itemFadeInUp 0.5s ease-out forwards;
  box-sizing: border-box; /* 确保宽度计算包含padding和border */
}

.line:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Staggered animation for list items */
.line:nth-child(1) { animation-delay: 0.1s; }
.line:nth-child(2) { animation-delay: 0.15s; }
.line:nth-child(3) { animation-delay: 0.2s; }
.line:nth-child(4) { animation-delay: 0.25s; }
.line:nth-child(5) { animation-delay: 0.3s; }
/* Add more if needed */

@keyframes itemFadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-li-item {
  width: calc(100% - 40px); /* Adjust width considering padding */
  height: 90px;
  margin-left: 20px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center; /* Center content vertically */
  padding: 10px 0; /* Add some vertical padding */
  overflow: hidden; /* 防止内容溢出 */
}

.prename {
  text-align: left;
  line-height: 1.4; /* Improved line height */
  margin-top: 5px;
  margin-bottom: 5px; /* Adjusted margin */
  color: #333; /* Darker text for better readability */
  font-size: 17px; /* Slightly larger font */
  font-weight: 500; /* Medium weight */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
  width: 100%; /* 确保宽度为100% */
  max-width: 100%; /* 限制最大宽度 */
}

.line:hover .prename {
  color: #409EFF; /* Highlight title on hover */
}

.ptime {
  text-align: left; /* Align with title */
  line-height: 1.4;
  margin-top: 0px; /* Adjusted margin */
  margin-bottom: 5px;
  color: #888; /* Lighter gray for time */
  font-size: 13px; /* Slightly smaller font for time */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-msg-box {
  margin-top: 100px; /* Adjusted margin */
  color: #909399;
}

.util-col {
  display: flex;
  flex-direction: row-reverse;
  height: 50px; /* Increased height */
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-top: none;
  align-items: center; /* Vertically align button */
  padding-right: 15px; /* Add some padding */
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}


.add-btn-svg {
  width: 35px; /* Adjusted size */
  height: 35px;
  line-height: 35px;
  color: #78a8e4; /* Darker icon color */
}

.add-btn-svg:hover {
color: #409EFF;
}


/* General transitions for interactive elements */
.el-button, .el-select, .el-input {
  transition: all 0.3s ease-in-out;
}

.el-button:hover, .el-select:hover, .el-input:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Dialog styling */
.el-dialog {
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}

.el-dialog__header {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #303133;
}

.el-dialog__body {
  padding: 20px;
  color: #606266;
}

.el-dialog__footer {
  padding: 15px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

.dialog-footer .el-button--primary {
  background-color: #409EFF;
  border-color: #409EFF;
}

.dialog-footer .el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

</style>