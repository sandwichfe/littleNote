import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'manage-theme-colors'

// Apple 极简默认色：主色蓝 + 深灰文字 + 浅灰背景
const DEFAULTS = {
  accent: '#0071e3',
  textColor: '#111827',
  bgColor: '#f5f5f7'
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) }
}

function darken(hex: string, amount = 0.15) {
  const { r, g, b } = hexToRgb(hex)
  const f = 1 - amount
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const initial = saved ? JSON.parse(saved) : { ...DEFAULTS }

  const accent = ref<string>(initial.accent)
  const textColor = ref<string>(initial.textColor)
  const bgColor = ref<string>(initial.bgColor)

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accent: accent.value,
        textColor: textColor.value,
        bgColor: bgColor.value
      })
    )
  }

  // 将主题色写入 .manage-layout CSS 变量（纯色背景，无渐变）
  function applyTheme() {
    const el = document.querySelector('.manage-layout') as HTMLElement
    if (!el) return

    const a = accent.value
    const t = textColor.value
    const bg = bgColor.value

    el.style.setProperty('--manage-accent', a)
    el.style.setProperty('--manage-accent-strong', darken(a, 0.1))
    el.style.setProperty('--manage-accent-soft', withAlpha(a, 0.08))
    el.style.setProperty('--manage-slate', t)
    el.style.setProperty('--manage-muted', withAlpha(t, 0.55))
    el.style.setProperty('--manage-border', '#e5e7eb')
    el.style.setProperty('--manage-surface-strong', '#f3f4f6')
    // 阴影使用中性黑，避免彩色投影
    el.style.setProperty('--manage-shadow', '0 1px 3px rgba(0, 0, 0, 0.08)')
    el.style.setProperty('--manage-shadow-soft', '0 1px 3px rgba(0, 0, 0, 0.08)')
    el.style.setProperty('--manage-bg', bg)
    // 纯色背景，符合 stylerule 禁止渐变
    el.style.background = bg
  }

  function reset() {
    accent.value = DEFAULTS.accent
    textColor.value = DEFAULTS.textColor
    bgColor.value = DEFAULTS.bgColor
    save()
    applyTheme()
  }

  watch([accent, textColor, bgColor], () => {
    applyTheme()
  })

  return { accent, textColor, bgColor, applyTheme, save, reset, DEFAULTS }
})
