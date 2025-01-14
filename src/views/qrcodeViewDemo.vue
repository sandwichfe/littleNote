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
    <h1>{{ $route.name }} {{ $route.meta.title }}</h1>
    
    <!-- 基本使用 -->
    <h2 class="mt30 mb10">基本使用</h2>
    <QRCode value="https://blog.csdn.net/Dandrose" />
    
    <!-- 无边框 -->
    <h2 class="mt30 mb10">无边框</h2>
    <QRCode value="https://blog.csdn.net/Dandrose" :bordered="false" />

    <!-- 纠错等级 -->
    <h2 class="mt30 mb10">纠错等级</h2>
    <h3 class="mb10">
      纠错等级也叫纠错率，就是指二维码可以被遮挡后还能正常扫描，而这个能被遮挡的最大面积就是纠错率。
    </h3>
    <h3 class="mb10">
      通常情况下二维码分为 4 个纠错级别：L级 可纠正约 7% 错误、M级 可纠正约 15% 错误、Q级 可纠正约 25% 错误、H级
      可纠正约 30% 错误。
    </h3>
    <QRCode value="https://blog.csdn.net/Dandrose" error-level="M" />

    <!-- 自定义尺寸 -->
    <h2 class="mt30 mb10">自定义尺寸</h2>
    <el-row gutter="10">
      <el-col :span="12">
        <elButton @click="decline" :icon="() => h(Minus)">small</elButton>
      </el-col>
      <el-col :span="12">
        <elButton @click="increase" :icon="() => h(Plus)">large</elButton>
      </el-col>
    </el-row>
    <QRCode :size="size" value="https://blog.csdn.net/Dandrose" />

    <!-- 自定义样式 -->
    <h2 class="mt30 mb10">自定义样式</h2>
    <h3 class="mb10">自定义二维码颜色和背景色</h3>
    <el-row gutter="10">
      <el-col :span="12">
        <QRCode value="https://blog.csdn.net/Dandrose" color="#52c41a" />
      </el-col>
      <el-col :span="12">
        <QRCode value="https://blog.csdn.net/Dandrose" color="#1677FF" bg-color="#f5f5f5" />
      </el-col>
    </el-row>

    <!-- 自定义生成二维码 -->
    <h2 class="mt30 mb10">自定义生成二维码</h2>
    <el-row justify="center">
      <el-col :span="12">
        <QRCode :value="value" />
      </el-col>
      <el-col :span="12">
        <el-input v-model:value="value" :width="200" clearable />
      </el-col>
    </el-row>
  </div>
</template>

