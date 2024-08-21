<template>
  <div class="main_content">
 <!-- 添加 -->
    <div>
        <div class="url-path"  @click="addOrUpdateNote(-1)">
        <div>
          <svg-icon
            iconClass="add"
            className="list-btn-switch"
          ></svg-icon>
        </div>
        </div>
    </div>

    <div class="head head_bg">
      <!-- 搜索 -->
      <div class="keyword-select">
        <el-input
          v-model="serachValue"
          placeholder="请输入内容"
          ref="keywordSelect"
          clearable
        ></el-input>
      </div>
       <!-- 刷新 -->
      <div class="back-box" >
        <button onclick="location.reload()">
          <svg-icon
            iconClass="refresh"
            className="list-btn-switch"
          ></svg-icon>
        </button>
      </div>
    </div>

    <div
      :style="{height: scrollerHeight}"
      class="scroll_content"
      v-loading="loading"
      element-loading-text="o(*≧▽≦)ツ加载中~"
    >
      <vue-scroll
        :ops="ops"
        @handle-scroll="handleScroll"
        ref="vs"
        v-if="this.contents && this.contents.length > 0"
      >
        <div class="main_scroll_content">
          <ul>
            <li
              v-for="(c, index) in contents"
              :key="index"
              class="line"
              @mousedown="startTimer(c)"
              @mouseup="clearTimer"
            >
              <div class="file-li-item" @click="addOrUpdateNote(c.id)">
                <div class="prename">{{ c.title }}</div>
                <div class="ptime" >{{ c.updateTime?c.updateTime:c.createTime }}</div>
              </div>
            </li>
            <i></i
            ><i></i
            ><i></i
            ><i></i
            ><i></i
            ><i></i
            ><i></i>
          </ul>
        </div>
      </vue-scroll>

      <el-empty
        description="(ง •̀_•́)ง没有数据了"
        v-else
        image=""
        :image-size="200"
        class="empty-msg-box"
      ></el-empty>


<!-- 确认框 -->
      <el-dialog v-model="centerDialogVisible" title="删除" width="500" center>
          <span>
            确定删除？
          </span>
          <template #footer>
            <div class="dialog-footer">
              <el-button  @click="centerDialogVisible = false">Cancel</el-button>
              <el-button @click="centerDialogVisible = false">Confirm</el-button>
                
              
            </div>
          </template>
        </el-dialog>



    </div>
    <back-top v-show="backTopVisible" @click.native="backToTop()"></back-top>
    <div class="util-col">
      <!-- 样式切换 -->
      <div class="show-box" @click="switchList()">
        <button>
          <svg-icon
            iconClass="list-icon"
            className="list-btn-switch"
            v-if="listType == false"
          ></svg-icon>
          <svg-icon
            iconClass="app-icon"
            className="list-btn-switch"
            v-if="listType == true"
          ></svg-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// 节流函数
const delay = (function () {
  let timer = 0;
  return function (callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();
import { listNote } from "@/network/base"; //引入自己封装的axios请求函数
import BackTop from "../components/backTop/BackTop.vue";
import { love } from "@/utils/love";
import { ref } from 'vue'
import { openLoading,closeLoading } from "@/utils/loadingUtil";

const centerDialogVisible  = ref(false)


export default {
  name: "index",
  components: { BackTop,
     },
  data() {
    return {
      listType: true,
      contents: [{preName:"1",id:1}, {preName:"1",id:2}, {preName:"1",id:3},{preName:"1",id:4}],
      loading: false,
      backTopVisible: false,
      currentPath: '', 
      hs: [{ preName: "刷新" }],
      ops: {
        vuescroll: {
          mode: "native", //模式:pc natice 移动端是slice
          sizeStrategy: "percent", //父元素是否是固定的是就percent 不是就是number 填一个数值
          detectResize: true, //内容是否根据页面调整
        },
        scrollPanel: {
          initialScrollY: false, //初始化距离顶部的位置
          initialScrollX: false, //初始化距离左侧的位置
          scrollingX: true, // 是否开启横向滚动
          scrollingY: true, //是否开启竖向滚动
          speed: 300, //多长时间内完成一次滚动。 数值越小滚动的速度越快。
          easing: "easeInQuad", //默认动画
          verticalNativeBarPos: "right",
          maxHeight: undefined, //这是滚动条最大高度,内容高度小于 maxHeight 时高度自适应，超出的话出现滚动条。
          maxWidth: undefined, //这是滚动条最大宽度,内容宽度小于 maxWidth 时高度自适应，超出的话出现滚动条。
        },
        rail: {
          background: "#ffffff", //轨道的背景色。
          opacity: 0.5, //轨道的透明度。 0是透明，1是不透明
          size: "6px", //轨道的尺寸。
          specifyBorderRadius: false, //是否指定轨道的 borderRadius， 如果不那么将会自动设置。
          gutterOfEnds: null,
          gutterOfSide: "0px", //距离容器的距离
          keepShow: false, //是否即使 bar 不存在的情况下也保持显示。
        },
        bar: {
          showDelay: 500, //在鼠标离开容器后多长时间隐藏滚动条。
          onlyShowBarOnScroll: true, //是否只在滚动时显示 bar。
          keepShow: true, //滚动条是否保持显示。
          background: "#d9dcda", //滚动条背景色。
          opacity: 1, //滚动条透明度。
          hoverStyle: false,
          specifyBorderRadius: false, //是否指定滚动条的 borderRadius， 如果不那么和轨道的保持一致。
          minSize: false, //为 bar 设置一个最小尺寸, 从 0 到 1. 如 0.3, 代表 30%.
          size: "6px", //bar 的尺寸。
          disable: false, //是否禁用滚动条。
        },
      },
      pathOps: {
        rail: {
          background: "#ffffff", //轨道的背景色。
          opacity: 0.5, //轨道的透明度。 0是透明，1是不透明
          size: "6px", //轨道的尺寸。
          specifyBorderRadius: false, //是否指定轨道的 borderRadius， 如果不那么将会自动设置。
          gutterOfEnds: null,
          gutterOfSide: "0px", //距离容器的距离
          keepShow: false, //是否即使 bar 不存在的情况下也保持显示。
        },
        bar: {
          showDelay: 500, //在鼠标离开容器后多长时间隐藏滚动条。
          onlyShowBarOnScroll: true, //是否只在滚动时显示 bar。
          keepShow: false, //滚动条是否保持显示。
          background: "#d9dcda", //滚动条背景色。
          opacity: 1, //滚动条透明度。
          hoverStyle: false,
          specifyBorderRadius: false, //是否指定滚动条的 borderRadius， 如果不那么和轨道的保持一致。
          minSize: false, //为 bar 设置一个最小尺寸, 从 0 到 1. 如 0.3, 代表 30%.
          size: "2px", //bar 的尺寸。
          disable: true, //是否禁用滚动条。
        },
      },
      serachValue: "",
      centerDialogVisible:false,
      
    };
  },
    computed: {
      // 滚动区高度 
      scrollerHeight: function() {
      return (document.documentElement.clientHeight - 30-65-41-5) + 'px'; //自定义高度需求  不知道这多的5px哪来的..
       }
     },
  watch: {
    //watch serachValue change
    serachValue() {
      delay(() => {
        this.remoteMethod(this.serachValue);
      }, 300);
    },
  },
  activated() {
    //用户点击进入时执行的方法
    console.log("init");
  },
  deactivated() {
    //用户离开（点了别的组件）时执行的方法
    //离开时保存
    console.log("离开了");
  },
  created() {
    this.initList();
  },
  mounted() {
    love();
  },
  methods: {



    // 搜索框内每一次输入都会执行的事件
    remoteMethod(query) {
      if (query !== "") {
        setTimeout(() => {
          this.loading = true;
          getFileList(this.currentPath, query).then((res) => {
            this.contents = res.data;
            this.loading = false;
          });
        }, 200);
      } else {
        this.loading = true;
        getFileList(this.currentPath, null).then((res) => {
          this.contents = res.data;
          this.loading = false;
        });
      }
    },

    switchList() {
      this.listType = !this.listType;
      this.$refs["vs"].scrollIntoView(".main_scroll_content", 0);
    },

    initList() {
      listNote("","").then((res) => {
        this.contents = res;
      });



    },

    handleScroll(vertical, horizontal, nativeEvent) {
      // console.log(vertical.scrollTop)
      // 滚动超过400 就出现backtop图标
      if (vertical.scrollTop >= 400) {
        this.backTopVisible = true;
      } else {
        this.backTopVisible = false;
      }
    },

    backToTop() {
      this.$refs["vs"].scrollIntoView(".main_scroll_content", 100);
    },

    /**
     *  使url path的滚动条到最后
     */
    scrollLast() {
      this.$refs["pathVs"].scrollTo(
        {
          x: "100%",
        },
        0,
        "easeInQuad"
      );
    },

    /**
     * url path的内容发生变化后 滚动条滚到最后
     */
    handleResize() {
      // console.log('content has resized!')
      this.scrollLast();
    },

   /**
    * 返回上一级
    */
   backToPrevious(){
      if(this.currentPath==""){
        this.$message( {
          message: '(˃ ⌑ ˂ഃ )客官,返回不了啦',
          duration:1000,
          showClose:false,
          iconClass:null,
        });
        return;
      }
      // 当前返回上一级后的菜单index -1
      let currentIndex = this.hs.length-1-1;
      let currentContent = this.hs[currentIndex];
       //跳到上一层位置
      this.gopage(currentContent, currentIndex);
   },

   startTimer(c) {
      this.timer = setTimeout(() => {
        this.centerDialogVisible = true
      }, 1000); // 设置长按时间，单位为毫秒
    },
    clearTimer() {
      clearTimeout(this.timer);
    },

    addOrUpdateNote(id){
      
      // 开启loading
      openLoading();

        if(id==-1){
          this.$router.push(`/noteDetail/-1`)
        }else{
          this.$router.push(`/noteDetail/${id}`)
        }

        

    }


  },
};
</script>

<style scoped >
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

.url-path {
  color: #42859396;
  display: flex;
  word-break: keep-all; /* 内容/字不换行 */
  white-space: nowrap; /* 不换行 */
}

.url-path div {
  cursor: pointer;
  margin-left: 4px;
  margin-right: 4px;
  transition: background-color 0.9s ease;
  cursor: pointer; 
}

.url-path div::before {
        margin-left: 7.5px;
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

    .url-path div:hover::before {
        transform: scale(2);
        opacity: 1;
    }

    .url-path div span {
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
  border: 0; /* 清除默认边框 */
  outline: none;
  background-color: transparent; /*清除默认背景 */
}

.list-btn-switch {
  width: 40px;
  height: 40px;
  line-height: 40px;
}

.scroll_content {
  overflow-y: auto; /* 垂直方向超出时显示滚动条 */
  border: #ead9d9 solid 1px;
  background-color:rgb(237 237 237);
  border-bottom:none;
 
}

.loading-icon {
  background: #000;
}

ul {
  margin-left: 10px;
  margin-right: 10px;
  list-style: none;
  display: flex;
  flex-wrap: wrap; /** 子元素li超出换行 */
  justify-content: space-between; /**居中 从左往右 */
}

.main_scroll_content li {
  height: 100%;
}

ul > i {
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
  align-items: flex-start; /* 子元素在交叉轴（水平）上靠左对齐 */
  flex-direction: column; /* 设置子元素垂直排列 */
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


.main_scroll_content li:hover .svg-file-icon {
  scale: 1.1 1.1;
  transition: all 0.8s;
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
  border-top:none;
}


</style>