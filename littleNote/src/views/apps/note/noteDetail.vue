<template>
  <div id="note-detail-page">
    <!-- 顶部工具栏 -->
    <div class="note-toolbar">
      <!-- 左侧：标题 + 分组，点任意一个都打开同一个编辑弹窗；预览态只做展示 -->
      <div class="toolbar-left">
        <button
            type="button"
            class="note-title-text"
            :class="{ 'is-empty': !noteTitle, 'is-readonly': viewMode === 'preview' }"
            :title="noteTitle"
            @click="openTitleDialog"
        >
          <span class="note-title-label">{{ noteTitle || '无标题' }}</span>
          <!-- 编辑态悬浮时用铅笔暗示"可点开修改"，替代小手光标 -->
          <el-icon v-if="viewMode === 'edit'" class="note-title-edit-icon">
            <Edit/>
          </el-icon>
        </button>

        <!-- 分组：只做展示，点击同样打开编辑弹窗，真正改动都在弹窗里完成 -->
        <button
            type="button"
            class="note-group-trigger"
            :class="{ 'is-readonly': viewMode === 'preview' }"
            :title="currentGroupName"
            @click="openTitleDialog"
        >
          <span class="note-group-name">{{ currentGroupName }}</span>
        </button>
      </div>

      <!-- 右侧：模式操作区 + 删除（分组已在左侧紧跟标题，不在这里占位） -->
      <div class="toolbar-right">
        <!-- 模式操作区（参考 Google Docs 查看态）：编辑态是「预览图标 + 保存主按钮」，
             查看态只留一个显眼的「修改」按钮作为退出入口；
             保存状态不在界面上展示（后台静默自动保存），这里只保留操作按钮 -->
        <div class="primary-actions">
          <el-tooltip v-if="viewMode === 'edit'" content="预览" placement="bottom" :show-after="300">
            <button
                class="toolbar-btn"
                aria-label="预览"
                @click="viewMode = 'preview'"
            >
              <el-icon>
                <View/>
              </el-icon>
            </button>
          </el-tooltip>
          <el-tooltip v-if="viewMode === 'edit'" content="保存" placement="bottom" :show-after="300">
            <button
                class="toolbar-btn-primary"
                aria-label="保存"
                :disabled="saving"
                @click="saveNote()"
            >
              <el-icon>
                <DocumentChecked/>
              </el-icon>
              <span>保存</span>
            </button>
          </el-tooltip>
          <el-tooltip v-else content="回到编辑" placement="bottom" :show-after="300">
            <button
                class="toolbar-btn-primary"
                aria-label="修改"
                @click="viewMode = 'edit'"
            >
              <el-icon>
                <Edit/>
              </el-icon>
              <span>修改</span>
            </button>
          </el-tooltip>
        </div>

        <!-- 分隔线：把主操作与危险操作（删除）分开 -->
        <div class="toolbar-divider"></div>

        <!-- 删除按钮：新笔记尚未落库，不可删除 -->
        <el-tooltip content="删除" placement="bottom" :show-after="300">
          <button
              class="toolbar-btn toolbar-btn-delete"
              aria-label="删除"
              :disabled="noteData.noteId === -1"
              @click="deleteDialogVisible = true"
          >
            <el-icon>
              <Delete/>
            </el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>

    <div class="note-editor-wrap" v-loading="loading">
      <RichEditor
          ref="editorRef"
          v-model="valueHtml"
          :editable="viewMode === 'edit'"
          @change="markDirty"
          @update:char-count="charCount = $event"
      />
    </div>

    <!-- 底部状态栏：只放内容属性（字数），独占右下角 -->
    <div class="note-statusbar">
      <span class="note-char-count">{{ charCount }} 字</span>
    </div>

    <!-- 笔记信息弹窗：标题与分组都在这里改，确定后统一写回并标记未保存 -->
    <el-dialog
        v-model="titleDialogVisible"
        title="笔记信息"
        align-center
        width="min(560px, calc(100vw - 32px))"
        class="title-edit-dialog"
        :close-on-click-modal="false"
        @opened="focusTitleInput"
    >
      <!-- 标题：与下面的分组行共用同一套「标签 + 控件」结构，标签顶部对齐 -->
      <div class="title-dialog-group title-dialog-group--title">
        <span class="title-dialog-group-label">标题</span>
        <el-input
            ref="titleDialogInputRef"
            v-model="titleDraft"
            type="textarea"
            :rows="4"
            maxlength="100"
            show-word-limit
            resize="none"
            class="title-dialog-input"
            placeholder="留空则自动取正文开头作为标题"
            @keydown.enter="onTitleEnter"
        />
      </div>
      <!-- 分组：与标题一起在弹窗内改，避免在工具栏里多占一块位置 -->
      <div class="title-dialog-group">
        <span class="title-dialog-group-label">分组</span>
        <el-select
            v-model="groupDraft"
            placeholder="未分组"
            clearable
            class="title-dialog-group-select"
            popper-class="group-select-popper"
        >
          <el-option
              v-for="item in groups"
              :key="item.id"
              :label="item.groupName"
              :value="Number(item.id)"
          />
        </el-select>
      </div>
      <template #footer>
        <div class="title-dialog-footer">
          <button class="delete-dialog-btn delete-dialog-btn-cancel" @click="titleDialogVisible = false">
            取消
          </button>
          <button class="delete-dialog-btn title-dialog-btn-primary" @click="confirmTitleEdit">
            确定
          </button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
        v-model="deleteDialogVisible"
        align-center
        width="360px"
        :show-close="false"
        class="delete-confirm-dialog"
    >
      <div class="delete-dialog-content">
        <div class="delete-dialog-icon">
          <el-icon>
            <Delete/>
          </el-icon>
        </div>
        <div class="delete-dialog-text">
          <h3>确定删除这篇笔记吗？</h3>
          <p>删除后无法恢复，请确认是否继续。</p>
        </div>
      </div>
      <template #footer>
        <div class="delete-dialog-footer">
          <button class="delete-dialog-btn delete-dialog-btn-cancel" @click="deleteDialogVisible = false">
            取消
          </button>
          <button class="delete-dialog-btn delete-dialog-btn-confirm" @click="confirmDeleteNote">
            确定删除
          </button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue';
import RichEditor from '@/components/RichEditor/index.vue';
import {addNote, deleteNoteItem, editNote, getNote} from "@/network/note/note";
import {onBeforeRouteLeave, useRouter} from 'vue-router';
import {ElMessage, ElMessageBox} from 'element-plus'
import {Delete, DocumentChecked, Edit, View} from '@element-plus/icons-vue'
import {cipherText, decrypted} from "@/utils/aesUtil";
import {closeLoading} from "@/utils/loadingUtil";
import {listNoteGroup} from "@/network/note/noteGroup";

const router = useRouter();

type ViewMode = 'edit' | 'preview';

const props = withDefaults(defineProps<{
  initialViewMode?: ViewMode;
}>(), {
  initialViewMode: 'preview'
});

const noteData = ref({
  noteId: -1,
  groupId: null as number | null
});

const groupValue = ref<number | null>(null);
const groups = ref<any[]>([]);
const deleteDialogVisible = ref(false);
const noteTitle = ref('');
const charCount = ref(0);   // 正文字数，由编辑器同步

// 笔记信息弹窗：标题栏只做展示，标题与分组都在弹窗里改，确定后才写回
const titleDialogVisible = ref(false);
const titleDraft = ref('');          // 弹窗内的临时标题，取消即丢弃
const groupDraft = ref<number | null>(null); // 弹窗内的临时分组，取消即丢弃
const titleDialogInputRef = shallowRef();

const openTitleDialog = () => {
  if (viewMode.value === 'preview') return; // 预览态不允许改动
  titleDraft.value = noteTitle.value;
  groupDraft.value = groupValue.value;
  titleDialogVisible.value = true;
};

const focusTitleInput = () => titleDialogInputRef.value?.focus();

// 回车直接确认；输入法选词时的回车要放行，否则中文输入会被打断
const onTitleEnter = (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  confirmTitleEdit();
};

// 确定才写回标题与分组并置脏，空标题交给保存时用正文开头兜底
const confirmTitleEdit = () => {
  const nextTitle = titleDraft.value.trim();
  // 下拉清空时 el-select 给的是 undefined，统一收敛成 null；id 统一转成数字便于比较
  const nextGroup = groupDraft.value == null ? null : Number(groupDraft.value);
  titleDialogVisible.value = false;

  const titleChanged = nextTitle !== noteTitle.value;
  const groupChanged = nextGroup !== groupValue.value;
  if (!titleChanged && !groupChanged) return;

  if (titleChanged) {
    noteTitle.value = nextTitle;
    markDirty();
  }
  if (groupChanged) {
    groupValue.value = nextGroup;
    noteData.value.groupId = nextGroup ? Number(nextGroup) : null;
    markGroupChanged();
  }

  // 确认即落库，不用再等 3 秒自动保存；
  // 新建笔记若只改了分组（未置脏），仍按原逻辑不主动创建一条空笔记
  if (dirty.value) void saveNote();
};

const dirty = ref(false);   // 是否有未保存修改
const saving = ref(false);  // 保存请求进行中，避免并发提交
const loading = ref(false); // 笔记内容加载中
const saveError = ref(false); // 最近一次保存是否失败（仅用于自动保存失败提示去重）

// 停止输入多久后自动保存
const AUTO_SAVE_DELAY = 3000;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

// 预览态只读展示用的分组名；未选分组时给出兜底文案
const currentGroupName = computed(() => {
  if (groupValue.value === null) return '未分组';
  const hit = groups.value.find((item) => Number(item.id) === groupValue.value);
  return hit?.groupName || '未分组';
});

// 分组同属笔记内容，改动后要置脏才能触发自动保存；
// 新建笔记（id = -1）此时只记住分组，避免仅选了个分组就被自动保存成一条空笔记
const markGroupChanged = () => {
  if (noteData.value.noteId === -1) return;
  markDirty();
};


const editorRef = shallowRef();
const valueHtml = ref("");

// 视图模式：edit（编辑）、preview（预览）
const viewMode = ref<ViewMode>(props.initialViewMode);

const clearAutoSaveTimer = () => {
  if (!autoSaveTimer) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = null;
};

// 停止输入后自动保存，连续输入会不断重置计时
const scheduleAutoSave = () => {
  clearAutoSaveTimer();
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    void saveNote({ silent: true });
  }, AUTO_SAVE_DELAY);
};

// 统一的未保存入口：置脏、清失败态并安排自动保存
const markDirty = () => {
  dirty.value = true;
  saveError.value = false;
  scheduleAutoSave();
};

// 解密失败（历史明文或异常密文）时回退原文，避免内容被静默清空
const safeDecrypt = (raw: string) => {
  if (!raw) return '';
  try {
    return decrypted(raw) || raw;
  } catch {
    return raw;
  }
};

// 加载笔记：新建（id = -1）与详情共用一套回填逻辑
let loadToken = 0;
const loadNote = async (id: number) => {
  const token = ++loadToken;
  noteData.value.noteId = id;
  loading.value = true;
  clearAutoSaveTimer();

  try {
    if (id === -1) {
      valueHtml.value = '';
      noteTitle.value = '';
      groupValue.value = null;
      noteData.value.groupId = null;
    } else {
      const res = await getNote(id);
      if (token !== loadToken) return; // 已有更新的加载请求，丢弃本次结果

      valueHtml.value = safeDecrypt(res.data?.content || '');
      noteTitle.value = res.data?.title || '';
      const groupId = res.data?.groupId ?? null;
      groupValue.value = groupId === null ? null : Number(groupId);
      noteData.value.groupId = groupId === null ? null : Number(groupId);
    }

    if (token === loadToken) {
      dirty.value = false;
      saveError.value = false;
    }
  } catch {
    ElMessage.error('笔记加载失败');
  } finally {
    // 多个加载请求并发时，只由最后一次负责收起加载态
    if (token === loadToken) loading.value = false;
  }
};

// 未保存确认弹窗：返回 true 表示确认放弃修改
const confirmDiscard = async (message: string) => {
  try {
    await ElMessageBox.confirm(message, '未保存提醒', {
      confirmButtonText: '离开',
      cancelButtonText: '继续编辑',
      type: 'warning',
    });
    return true;
  } catch {
    return false;
  }
};

// 正文变动由编辑器 @change 立即通知（标题走输入事件），这里无需再监听 v-model

// 切到预览时把未保存的改动落库，让预览始终对应已保存的内容；
// 这里走非静默保存，保存成功后会有提示，避免用户不知道刚才的改动已经存下来了
watch(viewMode, (mode) => {
  if (mode === 'preview' && dirty.value) void saveNote();
});

// 同一路由复用组件时 onMounted 不会再次执行，必须监听参数变化重新加载
watch(() => router.currentRoute.value.params.id, async (val) => {
  const id = Number(val);
  if (!Number.isFinite(id) || id === noteData.value.noteId) return;

  // 同页切换笔记同样要保护未保存内容，取消时回退地址，保持界面与 URL 一致
  if (dirty.value) {
    const previousId = noteData.value.noteId;
    if (!(await confirmDiscard('当前笔记有未保存的修改，切换后将丢失，确定继续吗？'))) {
      await router.replace({
        path: `/noteDetail/${previousId}`,
        query: router.currentRoute.value.query,
      });
      return;
    }
  }

  await loadNote(id);
});

// 外部带 query 进入（或刷新）时同步视图模式
watch(() => router.currentRoute.value.query.viewMode, (val) => {
  viewMode.value = val === 'edit' ? 'edit' : 'preview';
});

// 刷新/关闭标签页无法自定义文案，只触发浏览器原生确认
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!dirty.value) return;
  // 现代浏览器统一由 preventDefault 触发原生确认（returnValue 已废弃）
  event.preventDefault();
};

onMounted(async () => {
  const paramId = Number(router.currentRoute.value.params.id);
  const initialId = Number.isFinite(paramId) ? paramId : -1;

  // 分组列表独立加载，不阻塞笔记内容
  listNoteGroup(-1, -1).then((res) => {
    groups.value = res.data.records || [];

    // 如果是新建笔记且没有选中分组，则默认选中第一个分组
    if (initialId === -1 && !groupValue.value && groups.value.length > 0) {
      groupValue.value = Number(groups.value[0].id);
      noteData.value.groupId = Number(groups.value[0].id);
    }
  });

  window.addEventListener('keydown', handleEvent);
  window.addEventListener('beforeunload', handleBeforeUnload);

  await loadNote(initialId);
  closeLoading();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEvent);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  if (ctrlSTimer) clearTimeout(ctrlSTimer);
  clearAutoSaveTimer();
});

// 有未保存修改时，离开页面需二次确认
onBeforeRouteLeave(async () => {
  if (!dirty.value) return true;
  return confirmDiscard('当前笔记有未保存的修改，确定离开吗？');
});

// 将编辑器纯文本整理为标题，回车和连续空白统一转为空格。
const buildNoteTitle = (text: string) => {
  return text.replace(/\s+/g, ' ').trim().substring(0, 100);
};

// silent 用于自动保存：成功不打扰用户，失败仍要提醒一次（内容没落库不能让用户以为存好了）
const saveNote = async (options: { silent?: boolean } = {}) => {
  const { silent = false } = options;
  const editor = editorRef.value;
  if (!editor || saving.value) return;
  if (silent && !dirty.value) return;

  // 标题优先取输入框，留空时退回正文自动生成，并回填到输入框保持界面与实际一致
  const title = noteTitle.value.trim() || buildNoteTitle(editor.getText());
  noteTitle.value = title;
  const snapshot = editor.getHTML();
  const noteValue = cipherText(snapshot);

  // 保存期间继续编辑的内容不算已保存，用快照比对决定是否清除脏标记
  const markSaved = () => {
    dirty.value = editor.getHTML() !== snapshot || noteTitle.value !== title;
    saveError.value = false;
  };

  // 失败统一入口：手动保存必提示；自动保存只在"首次失败"时提示一次，连续失败不反复弹窗
  const reportSaveError = (msg: string) => {
    const alreadyFailed = saveError.value;
    saveError.value = true;
    if (!silent || !alreadyFailed) ElMessage.error({message: msg, grouping: true});
  };

  clearAutoSaveTimer();
  saving.value = true;
  let saved = false;

  try {
    if (noteData.value.noteId === -1) {
      const res = await addNote(null, noteValue, title, noteData.value.groupId);
      if (res.code !== 200 || !res.data) {
        reportSaveError(res.msg || '保存失败');
        return;
      }
      noteData.value.noteId = res.data;
      markSaved();
      saved = true;
      // 保留 query（viewMode），否则首次保存后会被 query watch 打回预览模式
      void router.replace({
        path: `/noteDetail/${res.data}`,
        query: router.currentRoute.value.query,
      });
      if (!silent) ElMessage.success('保存成功！');
    } else {
      const res = await editNote(noteData.value.noteId, noteValue, title, noteData.value.groupId);
      if (res.code !== 200) {
        reportSaveError(res.msg || '保存失败');
        return;
      }
      markSaved();
      saved = true;
      if (!silent) ElMessage.success('保存成功！');
    }
  } catch {
    reportSaveError('保存失败，请稍后重试');
  } finally {
    saving.value = false;
    // 保存期间又有新改动时，等这一轮结束后再安排下一次
    if (saved && dirty.value) scheduleAutoSave();
  }
};

const delNote = () => {
  if (noteData.value.noteId === -1) {
    ElMessage.warning('新笔记无法删除');
    return;
  }
  deleteNoteItem(noteData.value.noteId).then(() => {
    // 删除成功后不再拦截离开，并取消可能待触发的自动保存
    clearAutoSaveTimer();
    dirty.value = false;
    saveError.value = false;
    ElMessage.success('删除成功！');
    router.push(`/note`);
  });
};

const confirmDeleteNote = () => {
  deleteDialogVisible.value = false;
  delNote();
};


let ctrlSTimer: ReturnType<typeof setTimeout> | null = null;

// 兼容 Windows/Linux 的 Ctrl 与 macOS 的 Cmd
const isModifierKey = (event: KeyboardEvent) => event.ctrlKey || event.metaKey;

function handleEvent(event: KeyboardEvent) {
  // 统一转小写，避免开启 Caps Lock 后组合键失效
  const key = event.key.toLowerCase();

  if (isModifierKey(event) && key === 'd') {
    if (viewMode.value === 'preview') {
      event.preventDefault();
      return;
    }

    if (viewMode.value === 'edit') {
      event.preventDefault();
      editorRef.value?.deleteCurrentLine();
      return;
    }

  }

  // 保留 Ctrl/Cmd + Shift + S 给浏览器自身的"另存为"
  if (isModifierKey(event) && key === 's' && !event.shiftKey) {
    // 预览态阻止浏览器另存为，同时与（已隐藏的）保存按钮保持一致：不触发保存
    event.preventDefault();
    if (viewMode.value === 'preview') return;

    // 多次触发 给出提示
    if (ctrlSTimer) {
      ElMessage({
        message: `⚡️ 少侠，你的手速突破系统结界啦！`,
        type: 'success',
      });
      return;
    }
    saveNote();
    ctrlSTimer = setTimeout(() => {
      ctrlSTimer = null;
    }, 1000); // 1秒内无法重复保存
  }
}

</script>

<style scoped>
#note-detail-page {
  /* 父级 .app-content 已占满 header 以下空间，这里跟随父级高度，避免写死 header 尺寸 */
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

/* 编辑区容器：撑满剩余高度，滚动交给编辑器内部 */
.note-editor-wrap {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  margin-top: 5px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  overflow: hidden;
}

/* 顶部工具栏 */
.note-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background: #fff;
  flex-shrink: 0;
  min-height: 45px;
  gap: 16px;
}

/* 左侧：标题 + 分组入口，占满剩余宽度，长标题自行省略 */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* 主操作区：宽度固定为「预览图标 + 主按钮」的尺寸，
   两种模式下主按钮右边缘和位置都不变，切换时不会左右跳 */
.primary-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 116px;
  flex-shrink: 0;
}

/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: #e8e8e8;
  flex-shrink: 0;
}

/* 底部状态栏：只承载字数这类内容属性，独占右下角；
   分隔靠编辑器容器自身的下边框，不再重复画线 */
.note-statusbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  height: 28px;
  padding: 0 16px;
  color: #9aa0a6;
  font-size: 12px;
  line-height: 1;
}

/* 标题：位于工具栏左上角，只做单行展示，点击打开弹窗编辑 */
.note-title-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  /* 按内容收缩，让分组入口紧跟在标题右侧，而不是被推到最右边 */
  flex: 0 1 auto;
  min-width: 0;
  /* 限制标题占位宽度：长标题不把工具栏横向拉满，超出部分直接省略 */
  max-width: 320px;
  padding: 4px 6px;
  margin-left: -6px; /* 抵消内边距，让文字左边缘与工具栏内边距对齐 */
  border: none;
  border-radius: 4px;
  background: transparent;
  font-family: inherit;
  text-align: left;
  /* 标题收敛为半强调：比正文醒目，但不抢正文的视觉重心 */
  color: #3c4043;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  overflow: hidden;
  /* 不用小手：标题是原地可改的内容而非跳转链接，悬浮时由铅笔图标作提示 */
  cursor: default;
  transition: background-color 0.15s ease;
}

/* 省略只作用在文字上，避免铅笔图标被一起压缩掉 */
.note-title-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 铅笔图标：编辑态常驻显示，提示标题可点击修改；预览态由模板 v-if 直接不渲染 */
.note-title-edit-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: #9aa0a6;
  transition: color 0.15s ease;
}

.note-title-text:hover:not(.is-readonly) {
  background-color: #f8f9fa;
}

.note-title-text:hover:not(.is-readonly) .note-title-edit-icon {
  color: #5f6368;
}

.note-title-text.is-empty {
  color: #c7cacf;
  font-weight: 400;
}

/* 预览态不可编辑，去掉可点击暗示（不用 disabled，否则悬浮 title 提示失效） */
.note-title-text.is-readonly {
  cursor: default;
}

/* 标题右侧的分组入口：只展示当前分组文字，点击和标题一样打开笔记信息弹窗 */
.note-group-trigger {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  max-width: 160px;
  height: 28px;
  padding: 0 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #80868b;
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: default;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.note-group-trigger:hover:not(.is-readonly) {
  background-color: #f1f3f4;
  color: #5f6368;
}

/* 预览态只做展示，去掉 hover 反馈 */
.note-group-trigger.is-readonly {
  cursor: default;
}

.note-group-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 正文字数：底部状态栏左侧，颜色字号跟随状态栏 */
.note-char-count {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 笔记信息弹窗：标题字号收敛、控件圆角统一，避免默认弹窗那种又大又松的观感 */
#note-detail-page :deep(.title-edit-dialog) {
  --el-dialog-padding-primary: 0;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(32, 33, 36, 0.16), 0 2px 8px rgba(32, 33, 36, 0.08);
}

#note-detail-page :deep(.title-edit-dialog .el-dialog__header) {
  padding: 20px 20px 14px;
  margin-right: 0;
}

#note-detail-page :deep(.title-edit-dialog .el-dialog__title) {
  color: #202124;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

/* 关闭按钮收成小圆角方块，只 hover 时给底色 */
#note-detail-page :deep(.title-edit-dialog .el-dialog__headerbtn) {
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

#note-detail-page :deep(.title-edit-dialog .el-dialog__headerbtn:hover) {
  background-color: #f1f3f4;
}

#note-detail-page :deep(.title-edit-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #5f6368;
}

#note-detail-page :deep(.title-edit-dialog .el-dialog__body) {
  padding: 0 20px;
}

#note-detail-page :deep(.title-edit-dialog .el-dialog__footer) {
  padding: 18px 20px 20px;
}

/* 标题输入框：8px 圆角 + 细描边，聚焦只加深描边，不出现默认的蓝色光圈 */
#note-detail-page :deep(.title-edit-dialog .el-textarea__inner) {
  padding: 10px 12px 26px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dadce0 inset;
  color: #202124;
  font-size: 14px;
  line-height: 1.6;
  transition: box-shadow 0.15s ease;
}

#note-detail-page :deep(.title-edit-dialog .el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #c7c9cc inset;
}

#note-detail-page :deep(.title-edit-dialog .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1.5px #3c4043 inset;
}

/* 字数提示：贴右下角并加一层白底，避免压在文字和边框上 */
#note-detail-page :deep(.title-edit-dialog .el-input__count) {
  right: 10px;
  bottom: 8px;
  padding: 0 4px;
  border-radius: 4px;
  background-color: #fff;
  color: #9aa0a6;
  font-size: 12px;
  line-height: 1.4;
}

/* 弹窗里的分组选择：一行「标签 + 下拉」，描边和圆角与标题框保持一致 */
.title-dialog-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.title-dialog-group-label {
  flex-shrink: 0;
  width: 32px;
  color: #5f6368;
  font-size: 13px;
}

.title-dialog-group-select {
  flex: 1;
  min-width: 0;
}

/* 标题行：多行输入，标签顶部对齐到首行文字，首行不需要上方间距 */
.title-dialog-group--title {
  margin-top: 0;
  align-items: flex-start;
}

.title-dialog-group--title .title-dialog-group-label {
  padding-top: 11px;
  line-height: 20px;
}

.title-dialog-input {
  flex: 1;
  min-width: 0;
}

.title-dialog-group-select :deep(.el-select__wrapper) {
  min-height: 36px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dadce0 inset;
}

.title-dialog-group-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #c7c9cc inset;
}

.title-dialog-group-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1.5px #3c4043 inset;
}

/* 底部按钮：圆角与弹窗统一，取消更轻、确定更实 */
.title-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.title-dialog-footer .delete-dialog-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1;
}

.title-dialog-btn-primary {
  background: #3c4043;
  color: #fff;
  box-shadow: 0 1px 3px rgba(32, 33, 36, 0.22);
}

.title-dialog-btn-primary:hover {
  background: #202124;
  box-shadow: 0 2px 6px rgba(32, 33, 36, 0.28);
}

.el-select {
  transition: box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-select:focus-within {
  border-radius: 6px;
}

:global(.group-select-popper.el-select__popper.el-popper) {
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(32, 33, 36, 0.16), 0 2px 8px rgba(32, 33, 36, 0.08);
}

:global(.group-select-popper.el-select__popper.el-popper .el-popper__arrow::before) {
  border-color: #dadce0;
  background: #fff;
}

:global(.group-select-popper .el-select-dropdown__list) {
  padding: 6px;
}

:global(.group-select-popper .el-select-dropdown__item) {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  color: #5f6368;
  font-size: 13px;
  font-weight: 500;
  line-height: 32px;
}

:global(.group-select-popper .el-select-dropdown__item.is-hovering) {
  background: #f1f3f4;
  color: #202124;
}

:global(.group-select-popper .el-select-dropdown__item.is-selected) {
  background: #e8eaed;
  color: #202124;
  font-weight: 600;
}

/* 次级图标按钮（预览、删除）：方形白底，文案走 tooltip */
.toolbar-btn {
  height: 32px;
  width: 32px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: #fff;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.toolbar-btn:hover {
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.toolbar-btn:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

/* 保存中禁用 */
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.toolbar-btn .el-icon {
  font-size: 15px;
}

/* 主操作按钮（编辑态=保存，查看态=修改）：图标 + 文字的实心 pill；
   两种模式都是两字文案，宽度一致，切换时主按钮本身不跳变 */
.toolbar-btn-primary {
  height: 32px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  background-color: #3c4043;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.08);
}

.toolbar-btn-primary:hover {
  background-color: #202124;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12);
}

.toolbar-btn-primary:active {
  background-color: #3c4043;
  transform: scale(0.98);
}

/* 保存中：避免重复提交 */
.toolbar-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.toolbar-btn-primary .el-icon {
  font-size: 16px;
}

/* 删除按钮 */
.toolbar-btn-delete {
  background-color: #fff;
  color: #d93025;
  border-color: transparent;
}

.toolbar-btn-delete:hover {
  background-color: #fce8e6;
  color: #c5221f;
}

.toolbar-btn-delete:active {
  background-color: #f9dedc;
}

#note-detail-page :deep(.delete-confirm-dialog) {
  --el-dialog-padding-primary: 0;
  border: 1px solid #f3c4bf;
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(32, 33, 36, 0.2), 0 4px 14px rgba(217, 48, 37, 0.12);
}

#note-detail-page :deep(.delete-confirm-dialog .el-dialog__header) {
  display: none;
}

#note-detail-page :deep(.delete-confirm-dialog .el-dialog__body) {
  padding: 20px 20px 0;
}

#note-detail-page :deep(.delete-confirm-dialog .el-dialog__footer) {
  padding: 18px 20px 20px;
}

.delete-dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.delete-dialog-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fce8e6;
  color: #d93025;
  font-size: 18px;
}

.delete-dialog-text h3 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
}

.delete-dialog-text p {
  margin: 6px 0 0;
  color: #5f6368;
  font-size: 13px;
  line-height: 1.6;
}

.delete-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.delete-dialog-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  line-height: 30px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-dialog-btn-cancel {
  border-color: #dadce0;
  background: #fff;
  color: #5f6368;
}

.delete-dialog-btn-cancel:hover {
  background: #f8f9fa;
  border-color: #c7c9cc;
  color: #202124;
}

.delete-dialog-btn-confirm {
  background: #d93025;
  color: #fff;
  box-shadow: 0 1px 3px rgba(217, 48, 37, 0.22);
}

.delete-dialog-btn-confirm:hover {
  background: #c5221f;
  box-shadow: 0 2px 6px rgba(217, 48, 37, 0.28);
}

.delete-dialog-btn:active {
  transform: scale(0.98);
}

.delete-dialog-btn:focus-visible {
  outline: 2px solid rgba(217, 48, 37, 0.28);
  outline-offset: 2px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .note-title-text {
    font-size: 15px;
  }

  .note-toolbar {
    padding: 6px 10px;
    flex-wrap: nowrap;
    gap: 8px;
    min-height: auto;
    align-items: center;
  }

  /* 小屏优先保证右侧操作可用，标题让位收缩 */
  .toolbar-left {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* 小屏标题与分组挤在一行，分组入口再收窄一点 */
  .note-group-trigger {
    max-width: 100px;
    height: 26px;
    padding: 0 4px;
  }

  .toolbar-right {
    flex: 0 0 auto;
    justify-content: flex-end;
    gap: 6px;
  }

  .toolbar-divider {
    display: none;
  }

  /* 底部状态栏小屏只收窄内边距 */
  .note-statusbar {
    height: 24px;
    padding: 0 10px;
    gap: 8px;
  }

  .toolbar-btn {
    height: 30px;
    width: 30px;
    padding: 0;
  }

  .toolbar-btn .el-icon {
    font-size: 14px;
  }

  /* 小屏主按钮同步收窄，宽度约束也一起缩小 */
  .primary-actions {
    min-width: 0;
    gap: 6px;
  }

  .toolbar-btn-primary {
    height: 30px;
    padding: 0 11px;
    gap: 5px;
    font-size: 12px;
  }

  .toolbar-btn-primary .el-icon {
    font-size: 14px;
  }

  #note-detail-page :deep(.delete-confirm-dialog) {
    width: calc(100vw - 32px) !important;
    max-width: 360px;
  }
}

</style>

