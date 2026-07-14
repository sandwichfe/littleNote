<template>
  <transition name="back-to-top-fade">
    <el-tooltip v-if="visible" content="返回顶部" placement="left" :show-after="300">
      <button
        class="back-to-top"
        type="button"
        aria-label="返回顶部"
        @click="scrollToTop"
      >
        <svg-icon iconClass="backtop" className="back-to-top-icon" aria-hidden="true" />
      </button>
    </el-tooltip>
  </transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch, ref } from 'vue';

interface ScrollPosition {
  x?: number;
  y?: number;
}

interface ScrollLike {
  y?: number;
  on?: (eventName: 'scroll' | 'scrollEnd', callback: (position?: ScrollPosition) => void) => void;
  off?: (eventName: 'scroll' | 'scrollEnd', callback: (position?: ScrollPosition) => void) => void;
  scrollTo?: (x: number, y: number, time?: number) => void;
}

const props = withDefaults(defineProps<{
  target?: HTMLElement | null;
  scroller?: ScrollLike | null;
  threshold?: number;
  duration?: number;
}>(), {
  target: null,
  scroller: null,
  threshold: 220,
  duration: 300,
});

const visible = ref(false);

let cleanupNativeScroll: (() => void) | null = null;
let cleanupScrollerScroll: (() => void) | null = null;

const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const updateVisible = (distance: number) => {
  visible.value = distance > props.threshold;
};

const bindNativeScroll = (target: HTMLElement | null | undefined) => {
  cleanupNativeScroll?.();
  cleanupNativeScroll = null;

  if (!target) return;

  const handleScroll = () => updateVisible(target.scrollTop);
  // 原生滚动容器复用入口，笔记页当前走 better-scroll 实例。
  target.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  cleanupNativeScroll = () => {
    target.removeEventListener('scroll', handleScroll);
  };
};

const bindScrollerScroll = (scroller: ScrollLike | null | undefined) => {
  cleanupScrollerScroll?.();
  cleanupScrollerScroll = null;

  if (!scroller?.on) return;

  const handleScroll = (position?: ScrollPosition) => {
    updateVisible(Math.abs(position?.y ?? scroller.y ?? 0));
  };
  scroller.on('scroll', handleScroll);
  scroller.on('scrollEnd', handleScroll);
  updateVisible(Math.abs(scroller.y ?? 0));

  cleanupScrollerScroll = () => {
    scroller.off?.('scroll', handleScroll);
    scroller.off?.('scrollEnd', handleScroll);
  };
};

const scrollToTop = () => {
  const duration = prefersReducedMotion() ? 0 : props.duration;

  if (props.scroller?.scrollTo) {
    props.scroller.scrollTo(0, 0, duration);
  } else if (props.target) {
    props.target.scrollTo({
      top: 0,
      behavior: duration > 0 ? 'smooth' : 'auto',
    });
  }

  visible.value = false;
};

watch(() => props.target, bindNativeScroll, { immediate: true });
watch(() => props.scroller, bindScrollerScroll, { immediate: true });

onBeforeUnmount(() => {
  cleanupNativeScroll?.();
  cleanupScrollerScroll?.();
});
</script>

<style scoped>
.back-to-top {
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  color: #6366f1;
  background: linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%);
  border: 2px solid rgba(165, 180, 252, 0.3);
  border-radius: 16px;
  box-shadow:
    0 10px 24px rgba(99, 102, 241, 0.11),
    0 3px 0 rgba(99, 102, 241, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -8px 14px rgba(165, 180, 252, 0.08);
  backdrop-filter: blur(8px);
  cursor: pointer;
  overflow: hidden;
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

/* 用伪元素做轻量贴纸感装饰，避免额外增加模板结构。 */
.back-to-top::before {
  content: '';
  position: absolute;
  pointer-events: none;
  inset: 4px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 12px;
}

.back-to-top:hover,
.back-to-top:focus-visible {
  color: #4f46e5;
  border-color: rgba(129, 140, 248, 0.4);
  box-shadow:
    0 14px 30px rgba(99, 102, 241, 0.15),
    0 4px 0 rgba(99, 102, 241, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -8px 14px rgba(165, 180, 252, 0.1);
  transform: translateY(-1px);
}

.back-to-top:active {
  transform: translateY(0);
}

.back-to-top:focus-visible {
  outline: 2px solid rgba(129, 140, 248, 0.38);
  outline-offset: 2px;
}

.back-to-top-icon {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
}

.back-to-top-fade-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.back-to-top-fade-leave-active {
  transition: opacity 0.16s ease-in, transform 0.16s ease-in;
}

.back-to-top-fade-enter-from,
.back-to-top-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top,
  .back-to-top::before,
  .back-to-top-fade-enter-active,
  .back-to-top-fade-leave-active {
    transition: none;
  }

  .back-to-top:hover,
  .back-to-top:focus-visible,
  .back-to-top:active {
    transform: none;
  }
}

@media screen and (max-width: 768px) {
  .back-to-top {
    right: 16px;
    bottom: 16px;
    width: 40px;
    height: 40px;
  }

  .back-to-top-icon {
    width: 22px;
    height: 22px;
  }
}
</style>
