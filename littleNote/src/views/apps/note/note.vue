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
          <el-input v-model="queryParams.keyword" placeholder="搜索笔记" ref="keywordSelect" size="large" clearable
                    @focus="handleSearchFocus" @blur="handleSearchBlur" @clear="handleSearchClear">
            <template #prefix>
              <svg-icon iconClass="search" className="search-icon" />
            </template>
            <!-- 显式搜索按钮：点击立即请求，不用等防抖或按 Enter -->
            <template #append>
              <el-button class="search-submit" @click="doSearch">搜索</el-button>
            </template>
          </el-input>

          <!-- 最近搜索：聚焦时展示，点击直接复用（mousedown.prevent 保住输入框焦点） -->
          <div v-if="showHistory && searchHistory.length > 0" class="search-history" @mousedown.prevent>
            <div class="search-history-head">
              <span>最近搜索</span>
              <button type="button" class="search-history-clear" @click="clearHistory">清空</button>
            </div>
            <button v-for="item in searchHistory" :key="item" type="button" class="search-history-item"
                    @click="applyHistory(item)">
              {{ item }}
            </button>
          </div>
        </div>
      </div>

      <!-- 添加 -->
      <el-tooltip content="新建" placement="bottom" :show-after="300">
        <el-button
          size="large"
          class="add-btn"
          aria-label="新建"
          @click="addOrUpdateNote(-1, 'edit')"
        >
          <el-icon class="add-btn-icon">
            <DocumentAdd />
          </el-icon>
        </el-button>
      </el-tooltip>

    </div>

    <!-- 结果概览：条数 + 当前筛选条件，固定在顶部不参与滚动（首屏骨架期不显示） -->
    <div v-if="!firstLoading" class="result-bar">
      <span class="result-count">共 {{ contents.length }} 条</span>
      <span v-if="selectedGroupName" class="result-chip">{{ selectedGroupName }}</span>
      <span v-if="queryParams.keyword.trim()" class="result-chip">“{{ queryParams.keyword.trim() }}”</span>
      <button v-if="hasActiveQuery" type="button" class="result-clear" @click="clearFilters">清除筛选</button>
    </div>

    <!-- 列表：外层只负责定位进度条，内层是原生滚动容器 -->
    <div class="list-box">
      <div ref="scrollContainer" class="scroll_content" :aria-busy="loading">
        <!-- 首屏骨架屏：只在首次加载时出现，避免整块遮罩闪白 -->
        <div v-if="firstLoading" class="skeleton-list" aria-hidden="true">
          <div v-for="n in 8" :key="n" class="skeleton-line">
            <div class="skeleton-bar skeleton-title"></div>
            <div class="skeleton-bar skeleton-text"></div>
            <div class="skeleton-bar skeleton-meta"></div>
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
                <!-- 第一层：标题独占一行，不被右侧信息挤压 -->
                <span class="prename note-highlight-html" v-html="getDisplayTitle(c)"></span>
                <!-- 第二层：正文摘要，搜索态为命中上下文 -->
                <span v-if="getDisplayContent(c)" class="pcontent note-highlight-html"
                      v-html="getDisplayContent(c)"></span>
                <!-- 第三层：相对时间 + 所属分组 -->
                <span class="note-meta">
                  <span class="ptime"
                        :title="formatFullTime(c.updateTime || c.createTime)">{{ formatRelativeTime(c.updateTime || c.createTime) }}</span>
                  <span v-if="c.groupName" class="note-group">{{ c.groupName }}</span>
                </span>
              </a>

              <!-- 卡片更多操作 -->
              <el-dropdown :ref="(el: unknown) => registerDropdownRef(c.id, el)"
                           trigger="click"
                           class="card-more"
                           placement="bottom-end"
                           @visible-change="(visible: boolean) => handleDropdownVisible(!!visible, c.id)"
                           @command="(command: string) => handleCardCommand(command, c)">
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
        <el-empty v-else class="empty-msg-box" :image-size="120" :description="emptyDescription">
          <!-- 分组内搜不到时，引导用户去全部笔记里再搜一次 -->
          <el-button v-if="isSearchEmpty && queryParams.groupId !== null" class="empty-action"
                     @click="searchInAllGroups">在全部笔记中搜索</el-button>
          <el-button v-if="isSearchEmpty" class="empty-action" @click="clearSearch">清空搜索</el-button>
          <el-button v-else class="empty-action" type="primary" @click="addOrUpdateNote(-1, 'edit')">
            新建第一篇
          </el-button>
        </el-empty>
      </div>

      <!-- 搜索时的顶部进度条，保留旧列表，不做整块遮罩；放在滚动区外，不随内容滚走 -->
      <div v-if="isRefreshing" class="list-progress" role="progressbar" aria-label="正在加载"></div>
    </div>

    <BackToTop :target="scrollContainer" />

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

/* ---------------- 搜索历史 ---------------- */

const SEARCH_HISTORY_KEY = 'littleNote:searchHistory';
const SEARCH_HISTORY_MAX = 8;

const readSearchHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
        ? list.filter((item): item is string => typeof item === 'string').slice(0, SEARCH_HISTORY_MAX)
        : [];
  } catch {
    // 缓存损坏或隐私模式禁用存储时按空历史处理
    return [];
  }
};

const searchHistory = ref<string[]>(readSearchHistory());
const showHistory = ref(false);
// 最近一次非空关键词：点清空（X）时补记历史，避免刚搜过的词被漏掉
let lastKeyword = '';

// 记录一次有效搜索，重复词提到最前
const saveSearchHistory = (word: string) => {
  const value = word.trim();
  if (!value) return;

  searchHistory.value = [value, ...searchHistory.value.filter(item => item !== value)].slice(0, SEARCH_HISTORY_MAX);
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value));
  } catch {
    // 存储不可用时只保留内存态
  }
};

// 聚焦即展开历史；一开始输入就由下面的 watch 收起，不遮挡结果
const handleSearchFocus = () => {
  showHistory.value = searchHistory.value.length > 0;
};

const handleSearchBlur = () => {
  showHistory.value = false;
  // 输入中途切走的词往往不完整，过短的不入历史
  if (queryParams.keyword.trim().length >= 2) saveSearchHistory(queryParams.keyword);
};

// 点清空（X）时：把刚搜过的词补进历史，并直接展开面板（清空后焦点仍在输入框）
const handleSearchClear = () => {
  saveSearchHistory(lastKeyword);
  lastKeyword = '';
  showHistory.value = searchHistory.value.length > 0;
};

const applyHistory = (word: string) => {
  showHistory.value = false;
  saveSearchHistory(word);
  queryParams.keyword = word;
};

const clearHistory = () => {
  searchHistory.value = [];
  showHistory.value = false;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // 忽略存储异常
  }
};

// 记录最近一次非空关键词；一开始输入就收起历史面板，避免遮挡结果
watch(() => queryParams.keyword, (value) => {
  const keyword = value.trim();
  if (keyword) {
    lastKeyword = keyword;
    showHistory.value = false;
  }
});

watch(() => [queryParams.groupId, queryParams.keyword], () => {
  if (isInitializing.value) return;
  debounce.run(() => {
    loadNotesByQuery();
  }, 300);
}, { deep: true });

const groups = ref<Array<{ id: number; groupName: string }>>([]);

const scrollContainer = ref<HTMLElement | null>(null);

// el-input 实例，只用到 focus
const keywordSelect = ref<{ focus: () => void } | null>(null);

// 原生滚动 + 桌面端按住拖动
const { resetScroll } = useNoteScroll(scrollContainer);

const router = useRouter();

const contents = ref<Note[]>([]);
const loading = ref(false);
// 首屏骨架屏标记，只在初始化阶段为 true
const firstLoading = ref(true);

// 已有列表情况下的加载（搜索/切分组），走顶部进度条 + 轻微弱化
const isRefreshing = computed(() => loading.value && !firstLoading.value);
const isSearchEmpty = computed(() => !!queryParams.keyword.trim());

/* ---------------- 结果概览 / 筛选 ---------------- */

const selectedGroupName = computed(() => {
  const group = groups.value.find(item => item.id === queryParams.groupId);
  return group?.groupName || '';
});

// 有关键词或已按分组筛选时，才需要「清除筛选」
const hasActiveQuery = computed(() => !!queryParams.keyword.trim() || queryParams.groupId !== null);

const emptyDescription = computed(() => {
  const keyword = queryParams.keyword.trim();
  return keyword ? `没有找到包含“${keyword}”的笔记` : '还没有笔记';
});

const clearFilters = () => {
  queryParams.keyword = '';
  queryParams.groupId = null;
  noteGroupStore.resetSelectedGroupId();
};

// 当前分组内没搜到，切到全部笔记再搜一次
const searchInAllGroups = () => {
  queryParams.groupId = null;
  noteGroupStore.resetSelectedGroupId();
  focusSearch();
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  // 原生滚动容器滚动时收起展开的菜单，避免 popper 与卡片错位
  scrollContainer.value?.addEventListener('scroll', closeDropdownOnScroll, { passive: true });
  initList();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  scrollContainer.value?.removeEventListener('scroll', closeDropdownOnScroll);
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
    // 新结果回到顶部
    nextTick(() => {
      resetScroll();
    });
  } catch (error) {
    console.error('Failed to load notes by query:', error);
  } finally {
    loading.value = false;
  }
};

// 显式搜索（点搜索按钮）：取消防抖立即请求，并把关键词记入历史
const doSearch = () => {
  showHistory.value = false;
  debounce.cancel();
  saveSearchHistory(queryParams.keyword);
  loadNotesByQuery();
};

const loadNotes = async (groupId: number | null = null, keyword = '') => {
  try {
    // listNote 的 groupId 只接受 number | undefined，null 统一转 undefined（axios 都不会带上该参数）
    const noteRes = await listNote(-1, -1, groupId ?? undefined, keyword);

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

// 标题多由正文首段自动生成，摘要又是正文开头，两者会大段重复，这里裁掉重叠部分
const stripRepeatedTitle = (summary: string, title: string) => {
  const titleKey = (title || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  if (!titleKey || !summary) return summary;

  let cursor = 0;
  let matched = 0;
  while (cursor < summary.length && matched < titleKey.length) {
    const char = summary[cursor];
    // 摘要里的换行、空格在比对时跳过
    if (!/\s/.test(char)) {
      if (char !== titleKey[matched]) return summary;
      matched++;
    }
    cursor++;
  }

  // 只有完整吃掉标题才认为是重复，避免误裁正常摘要
  return matched === titleKey.length ? summary.slice(cursor).trim() : summary;
};

const getDisplayContent = (note: Note) => {
  // 搜索态用后端高亮摘要（带命中上下文），普通态用纯文本摘要
  if (note.highlightContent) return buildHighlightSnippet(note.highlightContent);
  return buildHighlightSnippet(stripRepeatedTitle(note.summary || '', note.title || ''));
};

/* ---------------- 摘要清洗 ---------------- */

const SNIPPET_MAX = 150;         // 普通摘要最多展示的字符数
const SNIPPET_SOURCE_MAX = 400;  // 清洗前截取的原始长度，控制正则开销
const HIT_CONTEXT_BEFORE = 20;   // 命中词前保留的上下文长度
const HIT_CONTEXT_WINDOW = 100;  // 从命中词起展示的窗口长度（含命中词）

// 用不可见的控制字符做占位，长度固定为 1，便于按命中位置安全截取
const MARK_OPEN = '\u0001';
const MARK_CLOSE = '\u0002';

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
  // 先截原始长度再清洗，避免整篇正文跑正则。
  let snippet = value
      .slice(0, SNIPPET_SOURCE_MAX)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<(em|mark)\b[^>]*>/gi, highlightStart)
      .replace(/<\/(em|mark)>/gi, highlightEnd)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  if (!snippet) return '';

  // 换成单字符标记后围绕首个命中词取窗口，避免单行展示时高亮被截在屏幕外
  snippet = snippet.split(highlightStart).join(MARK_OPEN).split(highlightEnd).join(MARK_CLOSE);
  const hitIndex = snippet.indexOf(MARK_OPEN);

  if (hitIndex === -1) {
    snippet = snippet.slice(0, SNIPPET_MAX);
  } else {
    const total = snippet.length;
    const start = Math.max(0, hitIndex - HIT_CONTEXT_BEFORE);
    const end = Math.min(total, hitIndex + HIT_CONTEXT_WINDOW);
    snippet = snippet.slice(start, end);

    // 窗口边界可能切断配对标记，补平避免 mark 吞掉后续文本
    const openCount = snippet.split(MARK_OPEN).length - 1;
    const closeCount = snippet.split(MARK_CLOSE).length - 1;
    if (openCount > closeCount) snippet += MARK_CLOSE.repeat(openCount - closeCount);
    if (closeCount > openCount) snippet = MARK_OPEN.repeat(closeCount - openCount) + snippet;

    if (start > 0) snippet = `…${snippet}`;
    if (end < total) snippet += '…';
  }

  // 截断可能切在 emoji 等代理对中间，去掉半个字符避免乱码
  snippet = snippet.replace(/^[\uDC00-\uDFFF]/, '').replace(/[\uD800-\uDBFF]$/, '');

  return escapeHtml(snippet)
      .split(MARK_OPEN).join('<mark class="note-search-hit">')
      .split(MARK_CLOSE).join('</mark>');
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
    // 删除后即时移出列表，避免整表重新请求造成闪烁；原生滚动会自行收敛滚动位置
    contents.value = contents.value.filter(item => item.id !== note.id);
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

// popper 面板挂在 body 上，不会跟随卡片移动，滚动时直接收起已展开的菜单
const closeDropdownOnScroll = () => {
  if (openDropdownId.value === null) return;
  dropdownRefs.get(openDropdownId.value)?.handleClose?.();
  openDropdownId.value = null;
};

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
    // Enter 视为一次明确搜索，落进历史
    saveSearchHistory(queryParams.keyword);
    if (loading.value) return;
    const first = contents.value[0];
    if (first) openNoteWindow(first.id);
  }
};
</script>

<style scoped>
.main_content {
  margin: 0 auto;
  /* 宽屏下收成一列文档宽度，避免单行过长、阅读跨度太大 */
  max-width: 960px;
  width: 100%;
  position: relative;
  overflow: hidden;
  /* 留白处透出外层渐变背景，形成居中的文档卡片 */
  background-color: transparent;
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

/* 结果概览：条数 + 当前筛选条件 */
.result-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 10px;
  background: #fff;
  font-size: 12px;
  line-height: 1.4;
  color: #8a9199;
  flex-shrink: 0;
}

.result-count {
  font-variant-numeric: tabular-nums;
}

.result-chip {
  max-width: 40%;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.08);
  color: #0f766e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-clear {
  margin-left: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: #0d9488;
  font-size: 12px;
  cursor: pointer;
}

.result-clear:hover,
.result-clear:focus-visible {
  color: #0f766e;
  text-decoration: underline;
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
  /* 作为「最近搜索」面板的定位参照 */
  position: relative;
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

/* 搜索按钮：与主色同族的浅色块，避免在顶部工具栏里过于抢眼 */
.search-box :deep(.el-input-group__append) {
  padding: 0;
  background: rgba(13, 148, 136, 0.08);
  border-color: #d5e5e2;
  box-shadow: none;
}

.search-box :deep(.el-input-group__append .el-button) {
  height: 100%;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: #0f766e;
  font-size: 13px;
  box-shadow: none;
}

.search-box :deep(.el-input-group__append .el-button:hover),
.search-box :deep(.el-input-group__append .el-button:focus-visible) {
  background: rgba(13, 148, 136, 0.14);
  box-shadow: none;
}

/* 最近搜索面板，浮在列表之上 */
.search-history {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 280px;
  padding: 6px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.search-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px 6px;
  font-size: 12px;
  color: #9aa1a9;
}

.search-history-clear {
  padding: 0;
  border: none;
  background: transparent;
  color: #9aa1a9;
  font-size: 12px;
  cursor: pointer;
}

.search-history-clear:hover {
  color: #0d9488;
}

.search-history-item {
  display: block;
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #1f2328;
  font-size: 13px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.search-history-item:hover,
.search-history-item:focus-visible {
  background: #f1f3f4;
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
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2);
}

/* 列表外层：只承担进度条的定位参照 */
.list-box {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 列表滚动容器：走浏览器原生滚动 */
.scroll_content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* 滚到边界后不再把滚动链传给外层页面 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #e5e7eb;
  /* 灰底衬托白色条目，靠底色区分边界，不再依赖分隔线 */
  background-color: #f6f8fa;
  border-bottom: none;
  border-radius: 0 0 8px 8px;
  padding: 6px 8px;
}

/* 鼠标拖拽平移中：抓手光标 + 禁止选中文字 */
.scroll_content.is-dragging {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none;
}

/* 搜索中的顶部 2px 进度条 */
.list-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  background: rgba(13, 148, 136, 0.12);
  z-index: 5;
}

.list-progress::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  background: #0d9488;
  animation: listProgressMove 1s ease-in-out infinite;
}

@keyframes listProgressMove {
  from { left: -35%; }
  to { left: 100%; }
}

/* 限定到笔记列表，避免作用域样式命中 el-dropdown-menu 的根 ul */
.note-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  /* 条目之间的间隙，替代分隔线来做视觉分组 */
  gap: 6px;
  padding: 0;
  margin: 0;
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
  margin: 0;
  width: 100%;
  /* 每条独立成卡：白底 + 细边 + 圆角，靠间隙分组而不是分隔线 */
  background: #fff;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  opacity: 0;
  animation: itemFadeInUp 0.4s ease-out forwards;
  box-sizing: border-box;
}

.line:hover,
.line:focus-within {
  border-color: #d8dfe7;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.line:hover .prename {
  color: #0d9488;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  width: 100%;
  /* 标题 / 摘要 / 元信息三层，层间距由各自的 margin 控制 */
  min-height: 78px;
  /* 右侧留出「更多」按钮的位置 */
  padding: 12px 44px 12px 14px;
  overflow: hidden;
  /* 卡片本身是 a 标签，清掉默认链接样式 */
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  /* 禁止浏览器对 a 标签的原生拖拽，否则按住拖动会拖出链接虚影而中断滚动 */
  -webkit-user-drag: none;
}

/* 键盘 Tab 聚焦时的描边 */
.file-li-item:focus-visible {
  outline: 2px solid rgba(13, 148, 136, 0.5);
  outline-offset: -2px;
  border-radius: 6px;
}

/* 第一层：标题 */
.prename {
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.4;
  margin: 0;
  color: #1d2129;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

/* 第二层：摘要，搜索态为命中上下文 */
.pcontent {
  display: block;
  width: 100%;
  margin-top: 3px;
  text-align: left;
  line-height: 1.5;
  /* 比标题浅两档，和标题拉开层级 */
  color: #86909c;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-highlight-html :deep(em),
.note-highlight-html :deep(mark),
.note-highlight-html :deep(.highlight),
.note-highlight-html :deep(.note-search-hit) {
  /* 与主色一致的柔和高亮，避免大块黄色在灰阶列表里过于抢眼 */
  color: inherit;
  font-style: normal;
  font-weight: 600;
  background: rgba(13, 148, 136, 0.14);
  padding: 0 2px;
  border-radius: 2px;
}

/* 第三层：时间 + 所属分组，作为次要信息压在底部 */
.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
  line-height: 1.4;
}

.ptime {
  color: #a9aeb8;
  font-size: 12px;
  white-space: nowrap;
  /* 等宽数字，避免时间串长度不同导致文字抖动 */
  font-variant-numeric: tabular-nums;
}

.note-group {
  max-width: 40%;
  padding: 1px 8px;
  border-radius: 3px;
  background: #f2f3f5;
  color: #86909c;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 行右侧「更多」，垂直居中避免压住标题和底部元信息 */
.card-more {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
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

/* 首屏骨架屏：形状与真实条目保持一致 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 93px;
  margin: 0;
  padding: 12px 44px 12px 14px;
  background: #fff;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  box-sizing: border-box;
}

.skeleton-bar {
  height: 11px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2f7 25%, #f6f8fb 37%, #eef2f7 63%);
  background-size: 400% 100%;
  animation: skeletonShimmer 1.4s ease infinite;
}

.skeleton-title {
  width: 62%;
  height: 15px;
}

.skeleton-text {
  width: 90%;
}

.skeleton-meta {
  width: 16%;
  height: 10px;
}

@keyframes skeletonShimmer {
  from { background-position: 100% 50%; }
  to { background-position: 0 50%; }
}

.empty-msg-box {
  margin-top: 60px;
  color: #909399;
}

.empty-action {
  margin-top: 4px;
}

/* 窄屏下压缩行内边距，时间字号同步缩小 */
@media screen and (max-width: 768px) {
  .result-bar {
    padding: 0 15px 8px;
  }

  .file-li-item {
    min-height: 70px;
    padding: 10px 40px 10px 12px;
  }

  .prename {
    font-size: 15px;
  }

  .pcontent {
    margin-top: 2px;
    font-size: 12px;
  }

  .note-meta {
    margin-top: 6px;
  }

  .note-group {
    font-size: 11px;
  }

  .ptime {
    font-size: 11px;
  }
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
