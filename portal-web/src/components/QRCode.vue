<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import QRCode from 'qrcode'

interface Props {
  value?: string
  size?: number
  color?: string
  bgColor?: string
  bordered?: boolean
  borderColor?: string
  scale?: number
  errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high'
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  size: 200,
  color: '#000000',
  bgColor: '#FFFFFF',
  bordered: false,
  borderColor: '#000000',
  scale: 4,
  errorCorrectionLevel: 'medium'
})

const qrcode = ref('')

const generateQR = async () => {
  if (props.value) {
    qrcode.value = await QRCode.toDataURL(props.value, {
      errorCorrectionLevel: props.errorCorrectionLevel,
      width: props.size,
      margin: 0,
      scale: props.scale,
      color: {
        dark: props.color,
        light: props.bgColor
      }
    })
  }
}

watch(() => [props.value, props.size, props.color, props.bgColor, props.errorCorrectionLevel, props.scale], generateQR, { immediate: true })
</script>

<template>
  <div
    class="qrcode-container"
    :class="{ bordered: bordered }"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderColor: borderColor
    }"
  >
    <img :src="qrcode" alt="qrcode" />
  </div>
</template>

<style scoped lang="less">
.qrcode-container {
  display: inline-block;
  &.bordered {
    border: 1px solid;
    padding: 8px;
  }
  img {
    width: 100%;
    height: 100%;
    display: block;
  }
}
</style>
