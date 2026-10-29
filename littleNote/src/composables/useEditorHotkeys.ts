import { onBeforeUnmount, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

interface UseEditorHotkeysOptions {
  // 当前是否处于可编辑态，预览态只拦截浏览器默认行为、不执行动作
  canEdit: () => boolean;
  // Ctrl/Cmd + S：保存
  onSave: () => void;
  // Ctrl/Cmd + D：删除当前行
  onDeleteLine: () => void;
  // 两次保存之间的冷却时间，避免狂按重复提交
  saveCooldown?: number;
}

/**
 * 笔记编辑器快捷键：Ctrl/Cmd + S 保存、Ctrl/Cmd + D 删除当前行
 * 自动处理 window 事件注册与卸载，必须在 setup 顶层调用
 */
export function useEditorHotkeys({ canEdit, onSave, onDeleteLine, saveCooldown = 1000 }: UseEditorHotkeysOptions) {
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

  // 兼容 Windows/Linux 的 Ctrl 与 macOS 的 Cmd
  const isModifierKey = (event: KeyboardEvent) => event.ctrlKey || event.metaKey;

  function handleEvent(event: KeyboardEvent) {
    // 统一转小写，避免开启 Caps Lock 后组合键失效
    const key = event.key.toLowerCase();
    if (!isModifierKey(event)) return;

    if (key === 'd') {
      event.preventDefault();
      if (canEdit()) onDeleteLine();
      return;
    }

    // 保留 Ctrl/Cmd + Shift + S 给浏览器自身的"另存为"
    if (key === 's' && !event.shiftKey) {
      // 预览态阻止浏览器另存为，同时与（已隐藏的）保存按钮保持一致：不触发保存
      event.preventDefault();
      if (!canEdit()) return;

      // 冷却期内再次触发，只提示不重复保存
      if (cooldownTimer) {
        ElMessage({
          message: `⚡️ 少侠，你的手速突破系统结界啦！`,
          type: 'success',
        });
        return;
      }

      onSave();
      cooldownTimer = setTimeout(() => {
        cooldownTimer = null;
      }, saveCooldown);
    }
  }

  onMounted(() => window.addEventListener('keydown', handleEvent));

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleEvent);
    if (cooldownTimer) clearTimeout(cooldownTimer);
  });
}
