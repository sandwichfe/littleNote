import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import BScroll from 'better-scroll';

export function useNoteScroll(scrollContainer: Ref<HTMLElement | null>) {
  const scroll = ref<InstanceType<typeof BScroll> | null>(null);

  const refreshScroll = () => {
    if (scroll.value) {
      scroll.value.refresh();
      scroll.value.scrollTo(0, 0);
    }
  };

  const initScroll = () => {
    if (scrollContainer.value && !scroll.value) {
      nextTick(() => {
        scroll.value = new BScroll(scrollContainer.value!, {
          scrollY: true,
          click: true,
          mouseWheel: true,
          bounce: true,
          observeDOM: true,
          probeType: 3,
          scrollbar: {
            fade: false,
            interactive: true,
          },
        });
        setTimeout(() => refreshScroll(), 300);
      });
    }
  };

  const handleResize = () => {
    if (scroll.value) scroll.value.refresh();
  };

  onMounted(() => {
    nextTick(() => initScroll());
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return { scroll, refreshScroll };
}
