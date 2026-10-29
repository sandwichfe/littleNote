import { onBeforeUnmount, ref } from 'vue';
import { ElMessage } from 'element-plus';

interface UseNoteAutoSaveOptions {
  // 真正的落库逻辑，返回 true 表示已保存成功（决定保存结束后是否继续排期）
  save: (silent: boolean) => Promise<boolean>;
  // 停止输入多久后自动保存
  delay?: number;
}

/**
 * 笔记自动保存：脏标记 + 防抖排期 + 并发保护 + 失败提示去重
 * 只负责"什么时候存、存的状态如何"，存什么内容由 save 回调决定
 */
export function useNoteAutoSave({ save, delay = 3000 }: UseNoteAutoSaveOptions) {
  const dirty = ref(false);     // 是否有未保存修改
  const saving = ref(false);    // 保存请求进行中，避免并发提交
  const saveError = ref(false); // 最近一次保存是否失败（仅用于自动保存失败提示去重）

  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearAutoSaveTimer = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };

  // 停止输入后自动保存，连续输入会不断重置计时
  function scheduleAutoSave() {
    clearAutoSaveTimer();
    timer = setTimeout(() => {
      timer = null;
      void runSave(true);
    }, delay);
  }

  // 触发一次保存：silent 时不打扰用户，且无脏数据直接跳过
  async function runSave(silent = false) {
    if (saving.value) return;
    if (silent && !dirty.value) return;

    clearAutoSaveTimer();
    saving.value = true;
    let saved = false;

    try {
      saved = await save(silent);
    } catch {
      // 失败提示由 save 回调自己负责，这里只兜住异常，避免冒泡成未捕获错误
      saved = false;
    } finally {
      saving.value = false;
      // 保存期间又有新改动时，等这一轮结束后再安排下一次
      if (saved && dirty.value) scheduleAutoSave();
    }
  }

  // 统一的未保存入口：置脏、清失败态并安排自动保存
  const markDirty = () => {
    dirty.value = true;
    saveError.value = false;
    scheduleAutoSave();
  };

  // 失败统一入口：手动保存必提示；自动保存只在"首次失败"时提示一次，连续失败不反复弹窗
  const reportSaveError = (msg: string, silent: boolean) => {
    const alreadyFailed = saveError.value;
    saveError.value = true;
    if (!silent || !alreadyFailed) ElMessage.error({ message: msg, grouping: true });
  };

  // 加载/删除后清空脏状态与待触发的计时器
  const resetSaveState = () => {
    clearAutoSaveTimer();
    dirty.value = false;
    saveError.value = false;
  };

  // 组件卸载时兜底清掉待触发的自动保存，避免卸载后仍发起请求
  onBeforeUnmount(clearAutoSaveTimer);

  return {
    dirty,
    saving,
    saveError,
    markDirty,
    runSave,
    reportSaveError,
    clearAutoSaveTimer,
    resetSaveState,
  };
}
