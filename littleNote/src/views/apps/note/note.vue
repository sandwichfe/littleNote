<template>
  <div class="main_content">

    <div class="top-box">
      <div class="filter-container">
        <!-- 分组筛选 -->
        <div class="filter-item">
          <el-select v-model="queryParams.groupId" placeholder="类型" size="large" clearable
                     @clear="handleClear">
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
      <el-tooltip content="新建笔记" placement="bottom" :show-after="300">
        <el-button
          size="large"
          class="add-btn"
          aria-label="新建笔记"
          @click="addOrUpdateNote(-1, 'edit')"
        >
          <el-icon class="add-btn-icon">
            <DocumentAdd />
          </el-icon>
        </el-button>
      </el-tooltip>

    </div>

    <!-- 列表 -->
    <div ref="scrollContainer" class="scroll_content" v-loading="loading"
         element-loading-text="o(*≧▽≦)ツ加载中~">
      <div ref="scrollWrapper" class="scroll-wrapper">
        <div v-if="contents && contents.length > 0">
          <ul>
            <li v-for="(c, index) in contents" :key="index" class="line">
              <div class="file-li-item" @click="addOrUpdateNote(c.id)">
                <div class="prename note-highlight-html" v-html="getDisplayTitle(c)"></div>
                <div v-if="getDisplayContent(c)" class="pcontent note-highlight-html" v-html="getDisplayContent(c)"></div>
                <div class="ptime">{{ c.updateTime || c.createTime }}</div>
              </div>
            </li>
          </ul>
        </div>

        <el-empty description="(ง •̀_•́)ง没有数据了" v-else image="" :image-size="200" class="empty-msg-box"></el-empty>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'note' })

import { listNote, type Note } from "@/network/note/note";
import { listNoteGroup } from "@/network/note/noteGroup";
import { ref, watch, onMounted, nextTick, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useNoteGroupStore } from "@/store/noteGroup";
import { useNoteScroll } from "@/composables/useNoteScroll";
import { DocumentAdd } from '@element-plus/icons-vue';

// 定义查询对象接口
interface QueryParams {
  groupId: number | null;
  keyword: string;
}

const noteGroupStore = useNoteGroupStore();

const queryParams = reactive<QueryParams>({
  groupId: null,
  keyword: ''
});

const isInitializing = ref(true);

const debounce = (() => {
  let timer: ReturnType<typeof setTimeout>;
  return (callback: () => void, ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

watch(() => [queryParams.groupId, queryParams.keyword], () => {
  if (isInitializing.value) return;
  debounce(() => {
    loadNotesByQuery();
  }, 300);
}, { deep: true });

const groups = ref<Array<{ id: number; groupName: string }>>([]);

const scrollContainer = ref<HTMLElement | null>(null);
const scrollWrapper = ref<HTMLElement | null>(null);

const { refreshScroll } = useNoteScroll(scrollContainer);

const router = useRouter();

const contents = ref<Note[]>([]);
const loading = ref(false);

onMounted(() => {
  initList();
});

const handleClear = () => {
  noteGroupStore.resetSelectedGroupId();
};

const loadNoteGroups = async () => {
  try {
    const groupRes = await listNoteGroup(-1, -1);
    groups.value = groupRes.data.records;
  } catch (error) {
    console.error('Failed to load note groups:', error);
  }
};

const selectGroup = () => {
  if (!groups.value || groups.value.length === 0) return;

  const storeSaveId = noteGroupStore.selectedGroupId;

  if (storeSaveId) {
    const groupExists = groups.value.some(group => group.id === storeSaveId);
    if (groupExists) {
      queryParams.groupId = storeSaveId;
    } else if (storeSaveId === -1) {
      queryParams.groupId = null;
    } else if (storeSaveId === null) {
      queryParams.groupId = groups.value[0].id;
    }
  } else {
    queryParams.groupId = Number(groups.value[0].id);
  }
};

const loadNotesByQuery = async () => {
  loading.value = true;
  try {
    await loadNotes(queryParams.groupId, queryParams.keyword);
    nextTick(() => {
      refreshScroll();
    });
  } catch (error) {
    console.error('Failed to load notes by query:', error);
  } finally {
    loading.value = false;
  }
};

const loadNotes = async (groupId: number | null = null, keyword = '') => {
  try {
    const noteRes = await listNote(-1, -1, groupId, keyword);

    // 接口已按 ES 搜索返回结果，前端不再按标题二次过滤，避免正文命中被隐藏。
    contents.value = noteRes.data.records;

    return true;
  } catch (error) {
    console.error('Failed to load notes:', error);
    return false;
  }
};

const initList = async () => {
  isInitializing.value = true;
  loading.value = true;
  try {
    await loadNoteGroups();
    selectGroup();
    await loadNotes(queryParams.groupId, queryParams.keyword);
  } catch (error) {
    console.error('Failed to initialize data:', error);
  } finally {
    loading.value = false;
    isInitializing.value = false;
  }
};

const getDisplayTitle = (note: Note) => {
  // 高亮标题为空时回退到原始标题，保证列表始终有标题可展示。
  return buildHighlightSnippet(note.highlightTitle || note.title || '');
};

const getDisplayContent = (note: Note) => {
  return buildHighlightSnippet(note.highlightContent || '');
};

const escapeHtml = (value: string) => {
  return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
};

const buildHighlightSnippet = (value: string) => {
  const highlightStart = '___NOTE_HIGHLIGHT_START___';
  const highlightEnd = '___NOTE_HIGHLIGHT_END___';

  // 列表只展示搜索摘要文本，避免富文本里的 p/div 等标签撑乱卡片排版。
  const snippet = value
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<(em|mark)\b[^>]*>/gi, highlightStart)
      .replace(/<\/(em|mark)>/gi, highlightEnd)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return escapeHtml(snippet)
      .split(highlightStart).join('<mark class="note-search-hit">')
      .split(highlightEnd).join('</mark>');
};

type NoteViewMode = 'edit' | 'preview';

const addOrUpdateNote = (id: number, viewMode: NoteViewMode = 'preview') => {
  const url = router.resolve({
    path: `/noteDetail/${id}`,
    query: viewMode === 'edit' ? { viewMode } : undefined
  }).href;
  window.open(url, '_blank');
};
</script>

<style scoped>
.main_content {
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: #f4f6f8;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}

@media screen and (max-width: 768px) {
  .main_content {
    height: calc(100vh - 56px);
  }
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
  flex-shrink: 0;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .top-box {
    padding: 10px 15px;
    flex-wrap: nowrap;
  }
}

/* 极小屏幕适配 */
@media screen and (max-width: 500px) {
  .top-box {
    padding: 8px 10px;
  }
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  width: calc(100% - 50px);
  justify-content: space-between;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .filter-container {
    gap: 8px;
    flex: 1;
    min-width: 0;
    width: calc(100% - 40px);
  }
}

/* 极小屏幕适配 */
@media screen and (max-width: 500px) {
  .filter-container {
    gap: 5px;
    width: calc(100% - 35px);
  }
}

.filter-item {
  transition: all 0.3s ease;
  width: 120px;
  flex-shrink: 0;
  flex-grow: 0;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .filter-item {
    width: 100px;
  }
}

/* 极小屏幕适配 */
@media screen and (max-width: 500px) {
  .filter-item {
    width: 80px;
  }
}

.filter-item .el-select {
  width: 100%;
}

.search-box {
  flex: 1;
  min-width: 100px;
  margin-right: 10px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .search-box {
    min-width: 60px;
    margin-right: 5px;
  }
}

/* 极小屏幕适配 */
@media screen and (max-width: 500px) {
  .search-box {
    min-width: 40px;
    margin-right: 3px;
  }
}

.add-btn {
  min-width: 44px;
  width: 44px;
  height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #64748b;
  background: rgba(248, 250, 252, 0.7);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.2s ease;
}

.add-btn :deep(.el-icon) {
  font-size: 22px;
}

.add-btn:hover,
.add-btn:focus-visible {
  color: #475569;
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.add-btn:active {
  background: rgba(241, 245, 249, 0.9);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  transform: translateY(0);
}

.add-btn:focus-visible {
  outline: 2px solid rgba(100, 116, 139, 0.4);
  outline-offset: 2px;
}

.add-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .add-btn {
    min-width: 40px;
    width: 40px;
    height: 40px;
    padding: 0;
    margin-left: 5px;
  }

  .add-btn :deep(.el-icon) {
    font-size: 21px;
  }
}

/* 极小屏幕适配 */
@media screen and (max-width: 500px) {
  .add-btn {
    min-width: 36px;
    width: 36px;
    height: 36px;
    margin-left: 3px;
  }

  .add-btn :deep(.el-icon) {
    font-size: 20px;
  }
}

.el-select {
  transition: box-shadow 0.3s ease;
}

.el-select:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.scroll_content {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  border-bottom: none;
  border-radius: 0 0 8px 8px;
  padding: 10px;
}

.scroll-wrapper {
  width: 100%;
  min-height: 101%;
}

ul {
  margin-left: 10px;
  margin-right: 10px;
  list-style: none;
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 100%;
}

ul>i {
  width: 10rem;
}

.line {
  background-color: #fff;
  border-radius: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
  width: 100%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  opacity: 0;
  animation: itemFadeInUp 0.5s ease-out forwards;
  box-sizing: border-box;
}

.line:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.line:nth-child(1) { animation-delay: 0.1s; }
.line:nth-child(2) { animation-delay: 0.15s; }
.line:nth-child(3) { animation-delay: 0.2s; }
.line:nth-child(4) { animation-delay: 0.25s; }
.line:nth-child(5) { animation-delay: 0.3s; }

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
  width: calc(100% - 40px);
  min-height: 90px;
  height: auto;
  margin-left: 20px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  padding: 12px 0;
  overflow: hidden;
  cursor: pointer;
}

.prename {
  text-align: left;
  line-height: 1.35;
  margin: 0;
  color: #333;
  font-size: 17px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
  width: 100%;
  max-width: 100%;
}

.line:hover .prename {
  color: #409EFF;
}

.pcontent {
  text-align: left;
  line-height: 1.45;
  margin: 0;
  color: #666;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.note-highlight-html :deep(em),
.note-highlight-html :deep(mark),
.note-highlight-html :deep(.highlight),
.note-highlight-html :deep(.note-search-hit) {
  color: #d97706;
  font-style: normal;
  background: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
}

.ptime {
  text-align: left;
  line-height: 1.4;
  margin-top: 2px;
  margin-bottom: 0;
  color: #888;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-msg-box {
  margin-top: 100px;
  color: #909399;
}

.el-button, .el-select, .el-input {
  transition: all 0.3s ease-in-out;
}

.el-button:hover, .el-select:hover, .el-input:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>
