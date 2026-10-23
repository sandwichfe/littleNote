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
    <div ref="scrollContainer" class="scroll_content" :aria-busy="loading">
      <div ref="scrollWrapper" class="scroll-wrapper">
        <!-- 首屏骨架屏：只在首次加载时出现，避免整块遮罩闪白 -->
        <div v-if="firstLoading" class="skeleton-list" aria-hidden="true">
          <div v-for="n in 5" :key="n" class="skeleton-line">
            <div class="skeleton-bar skeleton-title"></div>
            <div class="skeleton-bar skeleton-text"></div>
            <div class="skeleton-bar skeleton-time"></div>
          </div>
        </div>

        <div v-else-if="contents && contents.length > 0">
          <ul class="note-list" :class="{ 'is-searching': isRefreshing }">
            <!-- key 用笔记 id，搜索后复用卡片，避免动画重播与节点错位 -->
            <li v-for="c in contents" :key="c.id" class="line">
              <!-- 用 a 承载整张卡片：支持 Tab 聚焦、Ctrl/中键新标签打开、右键复制链接 -->
              <a class="file-li-item"
                 :href="getNoteHref(c.id)"
                 @click="handleCardClick($event, c.id)">
                <span class="prename note-highlight-html" v-html="getDisplayTitle(c)"></span>
                <span v-if="getDisplayContent(c)" class="pcontent note-highlight-html" v-html="getDisplayContent(c)"></span>
                <span class="ptime"
                      :title="formatFullTime(c.updateTime || c.createTime)">{{ formatRelativeTime(c.updateTime || c.createTime) }}</span>
              </a>

              <!-- 卡片更多操作 -->
              <el-dropdown :ref="(el) => registerDropdownRef(c.id, el)"
                           trigger="click"
                           class="card-more"
                           placement="bottom-end"
                           @visible-change="(visible) => handleDropdownVisible(!!visible, c.id)"
                           @command="(command) => handleCardCommand(String(command), c)">
                <button type="button" class="card-more-btn" aria-label="更多操作">
                  <el-icon><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="copy">复制链接</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </li>
          </ul>
        </div>

        <!-- 空态区分：真的没笔记 / 搜索没结果 -->
        <el-empty v-else class="empty-msg-box" :image-size="160"
                  :description="isSearchEmpty ? '(๑•́ ₃ •̀๑)没有匹配的笔记' : '(ง •̀_•́)ง还没有笔记'">
          <el-button v-if="isSearchEmpty" class="empty-action" @click="clearSearch">清空搜索</el-button>
          <el-button v-else class="empty-action" type="primary" @click="addOrUpdateNote(-1, 'edit')">
            新建第一篇
          </el-button>
        </el-empty>

      </div>

      <!-- 搜索时的顶部进度条，保留旧列表，不做整块遮罩 -->
      <div v-if="isRefreshing" class="list-progress" role="progressbar" aria-label="正在加载笔记"></div>
    </div>

    <BackToTop :target="scrollContainer" :scroller="scroll" />

  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'note' })

import { listNote, deleteNoteItem, type Note } from "@/network/note/note";
import { listNoteGroup } from "@/network/note/noteGroup";
import { ref, watch, onMounted, onBeforeUnmount, nextTick, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useNoteGroupStore } from "@/store/noteGroup";
import { useNoteScroll } from "@/composables/useNoteScroll";
import BackToTop from "@/components/BackToTop.vue";
import { DocumentAdd, MoreFilled } from '@element-plus/icons-vue';

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
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  const run = (callback: () => void, ms: number) => {
    cancel();
    timer = setTimeout(callback, ms);
  };
  // 额外暴露 cancel，便于卸载时清掉未触发的定时器
  return { run, cancel };
})();

watch(() => [queryParams.groupId, queryParams.keyword], () => {
  if (isInitializing.value) return;
  debounce.run(() => {
    loadNotesByQuery();
  }, 300);
}, { deep: true });

const groups = ref<Array<{ id: number; groupName: string }>>([]);

const scrollContainer = ref<HTMLElement | null>(null);
const scrollWrapper = ref<HTMLElement | null>(null);

// el-input 实例，只用到 focus
const keywordSelect = ref<{ focus: () => void } | null>(null);

const { scroll, refreshScroll } = useNoteScroll(scrollContainer);

const router = useRouter();

const contents = ref<Note[]>([]);
const loading = ref(false);
// 首屏骨架屏标记，只在初始化阶段为 true
const firstLoading = ref(true);

// 已有列表情况下的加载（搜索/切分组），走顶部进度条 + 轻微弱化
const isRefreshing = computed(() => loading.value && !firstLoading.value);
const isSearchEmpty = computed(() => !!queryParams.keyword.trim());

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  initList();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  scroll.value?.off?.('scrollStart', closeDropdownOnScroll);
  // 卸载时清理防抖定时器，避免组件销毁后仍触发请求
  debounce.cancel();
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
  firstLoading.value = true;
  try {
    await loadNoteGroups();
    selectGroup();
    await loadNotes(queryParams.groupId, queryParams.keyword);
  } catch (error) {
    console.error('Failed to initialize data:', error);
  } finally {
    loading.value = false;
    firstLoading.value = false;
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

/* ---------------- 时间展示 ---------------- */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 兼容 iOS / Safari 对 "YYYY-MM-DD HH:mm:ss" 的解析
const parseTime = (value?: string) => {
  if (!value) return null;
  const time = new Date(value.replace(/-/g, '/'));
  return Number.isNaN(time.getTime()) ? null : time;
};

const pad = (num: number) => String(num).padStart(2, '0');

// 完整时间，挂在卡片 title 上，避免相对时间丢精度
const formatFullTime = (value?: string) => {
  const time = parseTime(value);
  if (!time) return value || '';
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}`;
};

// 相对时间：一周内用相对描述，超过一周回退为日期
const formatRelativeTime = (value?: string) => {
  const time = parseTime(value);
  if (!time) return value || '';

  const diff = Date.now() - time.getTime();
  if (diff < MINUTE_MS) return '刚刚';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} 分钟前`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} 小时前`;
  if (diff < 7 * DAY_MS) return `${Math.floor(diff / DAY_MS)} 天前`;

  return formatFullTime(value).slice(0, 10);
};

/* ---------------- 打开 / 操作笔记 ---------------- */

type NoteViewMode = 'edit' | 'preview';

const getNoteHref = (id: number) => router.resolve({ path: `/noteDetail/${id}` }).href;

const getNoteUrl = (id: number, viewMode: NoteViewMode = 'preview') => {
  const href = router.resolve({
    path: `/noteDetail/${id}`,
    query: viewMode === 'edit' ? { viewMode } : undefined
  }).href;
  return new URL(href, window.location.href).href;
};

// 同一笔记使用固定窗口名，重复点击复用已打开的窗口，不再堆积标签页
const openNoteWindow = (id: number, viewMode: NoteViewMode = 'preview') => {
  const absUrl = getNoteUrl(id, viewMode);
  const win = window.open(absUrl, `noteDetail-${id}`);

  if (!win) {
    // 被浏览器拦截时退化为当前页跳转，保证行为可用
    window.location.href = absUrl;
    return;
  }

  win.opener = null;
  win.focus();
};

const addOrUpdateNote = (id: number, viewMode: NoteViewMode = 'preview') => {
  openNoteWindow(id, viewMode);
};

// 普通左键走 named window 复用；Ctrl/Cmd/Shift/中键交给浏览器原生行为
const handleCardClick = (event: MouseEvent, id: number) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  openNoteWindow(id);
};

const writeClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 非安全上下文等情况走降级方案
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
};

const copyNoteLink = async (id: number) => {
  const copied = await writeClipboard(getNoteUrl(id));
  if (copied) {
    ElMessage.success('链接已复制');
  } else {
    ElMessage.error('复制失败，请手动复制');
  }
};

const getPlainTitle = (note: Note) => {
  return (note.title || '').replace(/<[^>]+>/g, '').trim() || '未命名笔记';
};

const removeNote = async (note: Note) => {
  try {
    await ElMessageBox.confirm(`确定删除「${getPlainTitle(note)}」吗？删除后不可恢复。`, '删除笔记', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
  } catch {
    // 取消删除
    return;
  }

  try {
    await deleteNoteItem(note.id);
    // 删除后即时移出列表，避免整表重新请求造成闪烁
    contents.value = contents.value.filter(item => item.id !== note.id);
    nextTick(() => {
      scroll.value?.refresh();
    });
    ElMessage.success('删除成功！');
  } catch (error) {
    console.error('Failed to delete note:', error);
    ElMessage.error('删除失败，请稍后重试');
  }
};

const handleCardCommand = (command: string, note: Note) => {
  if (command === 'edit') {
    addOrUpdateNote(note.id, 'edit');
  } else if (command === 'copy') {
    copyNoteLink(note.id);
  } else if (command === 'delete') {
    removeNote(note);
  }
};

/* ---------------- 更多菜单 ---------------- */

type DropdownLike = { handleClose?: () => void } | null;

// 记录每条笔记的下拉实例，滚动时用于收起当前展开的菜单
const dropdownRefs = new Map<number, DropdownLike>();
const openDropdownId = ref<number | null>(null);

const registerDropdownRef = (id: number, instance: unknown) => {
  if (instance) {
    dropdownRefs.set(id, instance as DropdownLike);
  } else {
    dropdownRefs.delete(id);
  }
};

const handleDropdownVisible = (visible: boolean, id: number) => {
  if (visible) {
    openDropdownId.value = id;
  } else if (openDropdownId.value === id) {
    openDropdownId.value = null;
  }
};

// better-scroll 用 transform 滚动，popper 面板不会跟随卡片，滚动开始即收起菜单
const closeDropdownOnScroll = () => {
  if (openDropdownId.value === null) return;
  dropdownRefs.get(openDropdownId.value)?.handleClose?.();
  openDropdownId.value = null;
};

watch(scroll, (instance) => {
  instance?.on?.('scrollStart', closeDropdownOnScroll);
}, { immediate: true });

/* ---------------- 快捷键 ---------------- */

const focusSearch = () => {
  keywordSelect.value?.focus();
};

const clearSearch = () => {
  queryParams.keyword = '';
  focusSearch();
};

const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  const key = event.key;

  // Ctrl/Cmd + K 聚焦搜索
  if ((event.ctrlKey || event.metaKey) && (key === 'k' || key === 'K')) {
    event.preventDefault();
    focusSearch();
    return;
  }

  // 「/」快捷聚焦搜索，输入态下不拦截
  if (key === '/' && !isTypingTarget(event.target)) {
    event.preventDefault();
    focusSearch();
    return;
  }

  // Esc 清空搜索（对话框打开时交给弹窗自己处理）
  if (key === 'Escape' && queryParams.keyword) {
    if (document.querySelector('.el-overlay, .el-message-box')) return;
    clearSearch();
    return;
  }

  // 搜索框内 Enter 打开首条；请求中拦截，避免打开旧结果
  if (key === 'Enter' && !event.isComposing && !event.ctrlKey && !event.metaKey) {
    const active = document.activeElement;
    if (!active?.closest('.search-box')) return;
    event.preventDefault();
    if (loading.value) return;
    const first = contents.value[0];
    if (first) openNoteWindow(first.id);
  }
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

/* 搜索中的顶部 2px 进度条 */
.list-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  background: rgba(64, 158, 255, 0.12);
  z-index: 5;
}

.list-progress::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  background: #409eff;
  animation: listProgressMove 1s ease-in-out infinite;
}

@keyframes listProgressMove {
  from { left: -35%; }
  to { left: 100%; }
}

/* 限定到笔记列表，避免作用域样式命中 el-dropdown-menu 的根 ul */
.note-list {
  margin-left: 10px;
  margin-right: 10px;
  list-style: none;
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 100%;
}

.note-list>i {
  width: 10rem;
}

/* 搜索请求中轻微弱化旧列表，并暂时屏蔽点击，避免打开旧结果 */
.note-list.is-searching {
  opacity: 0.6;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.line {
  position: relative;
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

.line:hover .prename {
  color: #409EFF;
}

/* 桌面端「更多」按钮 hover/focus 时出现，触摸端常驻显示 */
@media (hover: hover) {
  .line .card-more {
    opacity: 0;
  }

  .line:hover .card-more,
  .line:focus-within .card-more {
    opacity: 1;
  }
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
  /* 卡片本身是 a 标签，清掉默认链接样式 */
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

/* 键盘 Tab 聚焦时的描边 */
.file-li-item:focus-visible {
  outline: 2px solid rgba(64, 158, 255, 0.55);
  outline-offset: -2px;
  border-radius: 8px;
}

.prename {
  text-align: left;
  line-height: 1.35;
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
  width: 100%;
  max-width: 100%;
  /* 给右上角「更多」按钮留出空间，避免长标题被按钮压住 */
  padding-right: 18px;
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

/* 卡片右上角「更多」 */
.card-more {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  transition: opacity 0.2s ease;
}

.card-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.card-more-btn:hover,
.card-more-btn:focus-visible {
  color: #475569;
  background: rgba(148, 163, 184, 0.16);
}

.card-more-btn:focus-visible {
  outline: 2px solid rgba(100, 116, 139, 0.4);
  outline-offset: 1px;
}

/* 首屏骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
}

.skeleton-line {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-height: 90px;
  margin: 8px 20px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.skeleton-bar {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2f7 25%, #f6f8fb 37%, #eef2f7 63%);
  background-size: 400% 100%;
  animation: skeletonShimmer 1.4s ease infinite;
}

.skeleton-title {
  width: 46%;
  height: 16px;
}

.skeleton-text {
  width: 92%;
}

.skeleton-time {
  width: 22%;
  height: 10px;
}

@keyframes skeletonShimmer {
  from { background-position: 100% 50%; }
  to { background-position: 0 50%; }
}

.empty-msg-box {
  margin-top: 80px;
  color: #909399;
}

.empty-action {
  margin-top: 4px;
}

.el-button, .el-select, .el-input {
  transition: all 0.3s ease-in-out;
}

.el-button:hover, .el-select:hover, .el-input:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 减弱动效偏好兜底 */
@media (prefers-reduced-motion: reduce) {
  .line,
  .skeleton-bar,
  .list-progress::before {
    animation: none;
  }

  .line {
    opacity: 1;
  }

  .list-progress::before {
    left: 0;
    width: 100%;
  }

  .line,
  .prename,
  .card-more,
  .card-more-btn,
  .file-li-item,
  .note-list.is-searching {
    transition: none;
  }
}
</style>
