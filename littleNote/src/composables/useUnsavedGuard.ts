import { onBeforeUnmount, onMounted } from 'vue';
import type { Ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

interface UseUnsavedGuardOptions {
  isDirty: Ref<boolean>;
  // 同页切换被取消时回退的地址，保证界面与 URL 一致
  getFallbackPath: () => string;
  // 离开整页时的提示文案
  leaveMessage?: string;
}

/**
 * 未保存保护：路由离开、浏览器刷新/关闭、同页切换三个入口统一收口
 * 必须在 setup 顶层调用（内部依赖 onBeforeRouteLeave）
 */
export function useUnsavedGuard({
  isDirty,
  getFallbackPath,
  leaveMessage = '当前笔记有未保存的修改，确定离开吗？',
}: UseUnsavedGuardOptions) {
  const router = useRouter();

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

  // 同页切换笔记前确认：取消时回退地址，返回 false 表示不再继续加载
  const canSwitchNote = async () => {
    if (!isDirty.value) return true;
    const confirmed = await confirmDiscard('当前笔记有未保存的修改，切换后将丢失，确定继续吗？');
    if (!confirmed) {
      await router.replace({
        path: getFallbackPath(),
        query: router.currentRoute.value.query,
      });
    }
    return confirmed;
  };

  // 刷新/关闭标签页无法自定义文案，只触发浏览器原生确认
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value) return;
    // 现代浏览器统一由 preventDefault 触发原生确认（returnValue 已废弃）
    event.preventDefault();
  };

  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));

  // 有未保存修改时，离开页面需二次确认
  onBeforeRouteLeave(async () => {
    if (!isDirty.value) return true;
    return confirmDiscard(leaveMessage);
  });

  return { confirmDiscard, canSwitchNote };
}
