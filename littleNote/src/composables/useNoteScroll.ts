import { onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

// 拖拽判定阈值：位移小于该值按点击处理，避免按下时的手抖把点击吃掉
const DRAG_THRESHOLD = 5;
// 拖拽中的类名，供样式侧切换 cursor / 禁用文字选择
const DRAGGING_CLASS = 'is-dragging';

/**
 * 笔记列表滚动：原生 overflow 滚动 + 桌面端按住鼠标拖动平移。
 * 触摸端不接管，保留浏览器原生惯性滚动的手感。
 */
export function useNoteScroll(scrollContainer: Ref<HTMLElement | null>) {
  // 滚动的目标容器，挂载时缓存，卸载时用它解绑事件
  let container: HTMLElement | null = null;

  // 拖拽状态
  let pointerId: number | null = null;
  let startY = 0;
  let startScrollTop = 0;
  let dragging = false;
  // 拖拽结束后要吞掉紧随其后的那次 click，否则会误打开笔记
  let suppressClick = false;

  // 数据刷新后回到顶部
  const resetScroll = () => {
    if (container) container.scrollTop = 0;
  };

  // 点在原生滚动条上时交还给浏览器，否则会和滚动条自身的拖动打架
  const isOnScrollbar = (el: HTMLElement, e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    return e.clientX > rect.left + el.clientWidth;
  };

  const onPointerDown = (e: PointerEvent) => {
    // 触摸/触控笔交给原生滚动；只接管鼠标左键
    if (!container || e.pointerType !== 'mouse' || e.button !== 0) return;
    if (isOnScrollbar(container, e)) return;
    const target = e.target as HTMLElement | null;
    // 输入类元素内部保留原生的选区拖选
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

    pointerId = e.pointerId;
    startY = e.clientY;
    startScrollTop = container.scrollTop;
    dragging = false;
    suppressClick = false;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!container || pointerId === null || e.pointerId !== pointerId) return;

    const deltaY = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(deltaY) < DRAG_THRESHOLD) return;
      dragging = true;
      container.classList.add(DRAGGING_CLASS);
    }

    // 阻止默认行为，避免拖动过程中选中卡片文字
    e.preventDefault();
    container.scrollTop = startScrollTop - deltaY;
  };

  const endDrag = (e: PointerEvent) => {
    if (pointerId === null || e.pointerId !== pointerId) return;
    if (dragging) suppressClick = true;
    pointerId = null;
    dragging = false;
    container?.classList.remove(DRAGGING_CLASS);
  };

  // 捕获阶段拦截：卡片本身是 a 标签，拖完松手不能触发跳转
  const onClickCapture = (e: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  };

  onMounted(() => {
    container = scrollContainer.value;
    if (!container) return;

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('click', onClickCapture, true);
    // 拖拽时鼠标可能移出容器，move/up 统一挂到 window 上
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  });

  onUnmounted(() => {
    container?.removeEventListener('pointerdown', onPointerDown);
    container?.removeEventListener('click', onClickCapture, true);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    container = null;
  });

  return { resetScroll };
}
