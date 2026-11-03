<template>
  <!-- 封面在列表里只做视觉锚点，不给读屏重复念一遍 -->
  <span class="note-cover" aria-hidden="true">
    <img v-if="displayUrl" :src="displayUrl" alt="" loading="lazy" decoding="async" @error="handleError"/>
    <!-- 解析中或加载失败时用占位图标兜底，卡片高度保持稳定 -->
    <el-icon v-else class="note-cover-icon">
      <Picture/>
    </el-icon>
  </span>
</template>

<script setup lang="ts">
defineOptions({ name: 'NoteCover' });

import { onBeforeUnmount, ref, watch } from 'vue';
import { Picture } from '@element-plus/icons-vue';
import { resolveFileUrl } from '@/utils/oss';

const props = defineProps<{
  // 列表接口下发的封面：本站资源为 objectKey，外链为原始地址
  src?: string | null;
}>();

// 实际给 img 用的地址：objectKey 要先换预签名地址才能被浏览器直接加载
const displayUrl = ref('');
// 当前 key 是否已经强刷过一次，避免签名刚好失效时无限重试
let retried = false;
// 切换封面时丢弃在途结果，避免旧的签名覆盖新图
let token = 0;

const load = async (forceRefresh = false) => {
  const current = ++token;
  const url = await resolveFileUrl(props.src, forceRefresh);
  if (current !== token) return;
  displayUrl.value = url || '';
};

watch(() => props.src, () => {
  retried = false;
  displayUrl.value = '';
  void load();
}, { immediate: true });

// 预签名地址可能刚好过期，强刷一次仍失败才退回占位图
const handleError = () => {
  if (retried) {
    displayUrl.value = '';
    return;
  }
  retried = true;
  void load(true);
};

onBeforeUnmount(() => {
  token++;
});
</script>

<style scoped>
.note-cover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 6px;
  background: #f2f3f5;
  overflow: hidden;
}

.note-cover img {
  display: block;
  width: 100%;
  height: 100%;
  /* 固定盒子 + 裁切，保证不同比例的图片在列表里高度一致 */
  object-fit: cover;
  /* 卡片整体可点击，封面不参与原生拖拽，避免拖出图片虚影 */
  -webkit-user-drag: none;
}

.note-cover-icon {
  font-size: 20px;
  color: #c2c7d0;
}

/* 窄屏空间紧张，封面同步缩小一档 */
@media screen and (max-width: 768px) {
  .note-cover {
    width: 56px;
    height: 56px;
  }
}
</style>
