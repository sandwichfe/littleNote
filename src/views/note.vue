<template>
  <div class="main_content">


    <!-- 添加 -->
      <div class="top-box">
        <div class="add-btn" @click="addOrUpdateNote(-1)">
          <svg-icon iconClass="add" className="list-btn-switch" />
        </div>

        <!-- 分组筛选 -->
        <div>
          <el-select v-model="groupValue" placeholder="分组" size="large" style="width:180px; " clearable
            @change="changeGroup">
            <el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" />
          </el-select>
        </div>



    </div>

    <div class="head head_bg">
      <!-- 搜索 -->
      <div class="keyword-select">
        <el-input v-model="searchValue" placeholder="请输入内容" ref="keywordSelect" clearable />
      </div>
    </div>

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
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
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

    <div class="util-col">
      <!-- 样式切换 -->
      <div class="show-box" @click="switchList">
        <button>
          <svg-icon iconClass="list-icon" className="list-btn-switch" v-if="!listType" />
          <svg-icon iconClass="app-icon" className="list-btn-switch" v-if="listType" />
        </button>
      </div>
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
import { ref, computed, watch, onMounted, onActivated, onDeactivated, nextTick } from 'vue';
import { openLoading, closeLoading } from "@/utils/loadingUtil";
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useStore } from "vuex"; // 引入 Vuex store

const groupValue = ref('')

const groups = ref(
  [
    {
      id: 'Option1',
      groupName: 'Option1',
    },
  ]
)

// 处理选中项变化
const changeGroup = (newValue: string) => {
  let groupId = newValue?Number(newValue):null;
  loading.value = true;
  listNote(-1, -1,groupId).then((res) => {
    contents.value = res.data.records;
  }).finally(() => {
    loading.value = false;
  });

};

// 定义一个 ref 用于引用 DOM 元素  绑定dom的ref
const scrollContainer = ref<HTMLElement | null>(null);

// 设置滚动条到指定位置
const scrollToPosition = (position) => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = position;
  }
};

// 引入 store
const store = useStore();


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
const listType = ref(true);
const contents = ref<Note[]>([]);
const loading = ref(false);
const backTopVisible = ref(false);
const currentPath = ref('');
const searchValue = ref("");


// 计算属性
const scrollerHeight = computed(() => {
  return (document.documentElement.clientHeight - 30 - 65 - 41 - 5) + 'px';
});

// 监听
watch(searchValue, (newValue) => {
  delay(() => {
    remoteMethod(newValue);
  }, 300);
});

// 生命周期钩子
onActivated(() => {
});

onDeactivated(() => {
});

onMounted(() => {
  console.log("huilail...")
  initList();
  // 在页面加载完自动滚动到指定位置
  nextTick(() => {
    setTimeout(() => {
      const savedScrollPosition = store.state.scrollPosition;
      if (savedScrollPosition) {
        scrollToPosition(savedScrollPosition);  // 页面加载时滚动到 500px
      }
    }, 50);  // 延迟50，确保 DOM 已经渲染完成
  });
});


onBeforeRouteLeave((to, from, next) => {
  console.log("luyou likail ")

  // 路由离开时保存滚动条位置  
  let scrollTop = scrollContainer.value.scrollTop
  // debugger
  if (scrollTop) {
    // 将滚动条的垂直位置保存vuex
    store.dispatch("updateScrollPosition", scrollTop);
  }
  next();
});


// 搜索框内每一次输入都会执行的事件
const remoteMethod = (query) => {
  if (query !== "") {
    setTimeout(() => {
      loading.value = true;
      listNote(-1, -1).then((res) => {
        contents.value = res.data.records;
      }).finally(() => {
        loading.value = false;
      });
    }, 200);
  } else {
    loading.value = true;
    listNote(-1, -1).then((res) => {
      contents.value = res.data.records;
    }).finally(() => {
      loading.value = false;
    });
  }
};


// 切换列表
const switchList = () => {
  listType.value = !listType.value;
  // 这个方法应该是用来触发滚动
  const vs = document.querySelector(".main_scroll_content");
  vs?.scrollIntoView({ behavior: "smooth" });
};

const initList = () => {
  loading.value = true;
  Promise.all([
    listNote(-1, -1),
    listNoteGroup(-1, -1)
  ]).then(([noteRes, groupRes]) => {
    contents.value = noteRes.data.records;
    groups.value = groupRes.data.records;
  }).catch(error => {
    console.error('Failed to load initial data:', error);
    // Optionally show an error message to the user
  }).finally(() => {
    loading.value = false;
  });
  
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
  width: 95%;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: #f4f6f8; /* Light gray background for a softer look */
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Softer shadow */
}

.top-box {
  color: #42859396;
  display: flex;
  word-break: keep-all;
  white-space: nowrap;
  flex-direction: row-reverse;
}

.top-box div {
  cursor: pointer;
  transition: background-color 0.9s ease, transform 0.3s ease; /* Added transform transition */
}

.top-box .add-btn {
  position: relative; /* Needed for pseudo-element positioning */
}

.top-box .add-btn::before {
  margin-left: 17.5px;
  content: '';
  position: absolute;
  width: 25px;
  height: 30px;
  background-color: rgba(135, 206, 235, 0.4); /* Sky blueish with more opacity */
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease; /* Smoother transition */
  border-radius: 50%; /* Circular pulse */
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  z-index: 0; /* Ensure it's behind the icon */
}

.top-box .add-btn:hover::before {
  transform: scale(2.5); /* Larger pulse */
  opacity: 1;
}

.top-box .add-btn:hover {
  transform: scale(1.1); /* Slight scale up on hover for the button itself */
}

.top-box .add-btn span {
  position: relative;
  z-index: 1;
}

.el-select {
  transition: box-shadow 0.3s ease; /* Add transition for select focus */
}

.el-select:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); /* Element Plus like focus ring */
}

.head {
  margin-left: auto;
  line-height: 40px;
  height: 40px;
  background-color: #ffffff; /* White background for header */
  display: flex;
  justify-content: space-between;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); /* Subtle shadow for header */
}

.keyword-select .el-input__inner {
  border-radius: 6px; /* Rounded input field */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.keyword-select .el-input__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.scroll_content {
  overflow-y: auto;
  border: 1px solid #e0e0e0; /* Lighter border */
  background-color: #ffffff; /* White background for content area */
  border-bottom: none;
  border-radius: 8px;
  padding: 10px;
}

ul {
  margin-left: 10px;
  margin-right: 10px;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0; /* Remove default padding */
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

.show-box button {
  cursor: pointer;
  border: none;
  outline: none;
  background-color: transparent;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.show-box button:hover {
  background-color: #ecf5ff; /* Light blue background on hover */
  transform: scale(1.1);
}

.list-btn-switch {
  width: 35px; /* Adjusted size */
  height: 35px;
  line-height: 35px;
  color: #555; /* Darker icon color */
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