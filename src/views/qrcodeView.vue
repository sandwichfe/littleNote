<script setup lang="ts">
import QRCode from '../components/QRCode.vue'
import { h, ref } from 'vue'
import { ElButton, ElRow, ElCol, ElInput } from 'element-plus';
import { Minus, Plus } from '@element-plus/icons-vue';

const size = ref(160)
const value = ref('hello world')

const decline = () => {
  size.value = size.value - 10
  if (size.value < 48) {
    size.value = 48
  }
}

const increase = () => {
  size.value = size.value + 10
  if (size.value > 300) {
    size.value = 300
  }
}
</script>

<template>
  <div>
    
    <!-- 无边框 -->
    <h2 class="mt30 mb10">无边框</h2>
    <QRCode value="http://www.baidu.com" :bordered="false" error-level="M" />

  </div>
</template>

