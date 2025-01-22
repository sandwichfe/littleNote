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
          <li v-for="(c, index) in contents" :key="index" class="line" @mousedown="startTimer(c)" @mouseup="clearTimer">
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
import { listNote } from "@/network/base"; // 引入自己封装的axios请求函数
import { listNoteGroup } from "@/network/noteGroup";
import { love } from "@/utils/love";
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
  listNote(-1, -1,groupId).then((res) => {
    contents.value = res.data.records;
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
  let timer = 0;
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
const contents = ref([{ preName: "1", id: 1 }, { preName: "1", id: 2 }, { preName: "1", id: 3 }, { preName: "1", id: 4 }]);
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
  love();
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
        loading.value = false;
      });
    }, 200);
  } else {
    loading.value = true;
    listNote(-1, -1).then((res) => {
      contents.value = res.data.records;
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
  listNote(-1, -1).then((res) => {
    contents.value = res.data.records;
  });

  listNoteGroup(-1, -1).then((res) => {
    groups.value = res.data.records;
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
  openLoading();
  if (id === -1) {
    router.push(`/noteDetail/-1`);
  } else {
    router.push(`/noteDetail/${id}`);
  }
};
</script>

<style scoped>
.main_content {
  width: 95%;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.dirIcon {
  width: 40px;
  height: 40px;
  margin-left: auto;
  fill: currentColor;
  color: #c7cad4;
}

.fileIcon {
  width: 40px;
  height: 40px;
  margin-left: auto;
  fill: currentColor;
  color: #c8dae2;
}

.head {
  margin-left: auto;
  line-height: 40px;
  height: 40px;
  background-color: #e6ebe7ab;
  display: flex;
  justify-content: space-between;
}

.top-box {
  color: #42859396;
  display: flex;
  word-break: keep-all;
  /* 内容/字不换行 */
  white-space: nowrap;
  /* 不换行 */
  flex-direction: row-reverse; /* 使元素从右边开始排列 */
}

.top-box div {
  cursor: pointer;
  transition: background-color 0.9s ease;
  cursor: pointer;
}

.top-box .add-btn::before {
  margin-left: 17.5px;
  content: '';
  position: absolute;
  width: 25px;
  height: 30px;
  background-color: rgb(191 231 232 / 30%);
  transition: transform 0.3s, opacity 0.3s;
  border-radius: 5px;
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.top-box .add-btn:hover::before {
  transform: scale(2);
  opacity: 1;
}

.top-box .add-btn span {
  position: relative;
  z-index: 1;
}


.head_bg {
  border-radius: 8px;
}


.keyword-select {
  line-height: 40px;
  flex: 12;
}

.switch {
  line-height: 40px;
  /* flex: 1; */
  flex-shrink: 0;
  margin-right: 5px;
  cursor: pointer;
}

.show-box {
  /* flex: 1; */
  flex-shrink: 0;
  /* height: 30px;
  width: 30px; */
}


button {
  cursor: pointer;
  border: 0;
  /* 清除默认边框 */
  outline: none;
  background-color: transparent;
  /*清除默认背景 */
}

.list-btn-switch {
  width: 40px;
  height: 40px;
  line-height: 40px;
}

.scroll_content {
  overflow-y: auto;
  /* 垂直方向超出时显示滚动条 */
  border: #ead9d9 solid 1px;
  background-color: rgb(237 237 237);
  border-bottom: none;

}

.loading-icon {
  background: #000;
}

ul {
  margin-left: 10px;
  margin-right: 10px;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  /** 子元素li超出换行 */
  justify-content: space-between;
  /**居中 从左往右 */
}

ul>i {
  width: 10rem;
}

.line {
  background-color: #fff;
  border-radius: 8px;
  margin-top: 4px;
  margin-bottom: 2px;
  width: 100%;
}

.file-li-item {
  width: 90%;
  height: 90px;
  margin-left: 20px;
  display: flex;
  align-items: flex-start;
  /* 子元素在交叉轴（水平）上靠左对齐 */
  flex-direction: column;
  /* 设置子元素垂直排列 */
}

.prename {
  /* background-color: #4acfc1; */
  text-align: left;
  line-height: 60px;
  margin-top: 5px;
  margin-bottom: 0px;
  color: black;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptime {
  /* background-color: #7dce85; */
  text-align: center;
  line-height: 30px;
  margin-top: 5px;
  margin-bottom: 0px;
  color: #a9aaabc9;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.empty-msg-box {
  margin-top: 150px;
}

.util-col {
  display: flex;
  flex-direction: row-reverse;
  height: 40px;
  background-color: #fff;
  border: #ead9d9 solid 1px;
  border-top: none;
}
</style>