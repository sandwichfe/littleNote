import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'manage-theme-colors'

const DEFAULTS = {
  accent: '#193069',
  textColor: '#3A3034',
  bgColor: '#EFF1F8'
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

function lighten(hex: string, amount = 0.9) {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`
}

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const initial = saved ? JSON.parse(saved) : { ...DEFAULTS }

  const accent = ref<string>(initial.accent)
  const textColor = ref<string>(initial.textColor)
  const bgColor = ref<string>(initial.bgColor)

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accent: accent.value,
      textColor: textColor.value,
      bgColor: bgColor.value
    }))
  }

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
    el.style.setProperty('--manage-muted', withAlpha(t, 0.6))
    el.style.setProperty('--manage-border', withAlpha(a, 0.08))
    el.style.setProperty('--manage-surface-strong', bg)
    el.style.setProperty('--manage-shadow', `0 8px 24px ${withAlpha(a, 0.05)}`)
    el.style.setProperty('--manage-shadow-soft', `0 2px 8px ${withAlpha(a, 0.03)}`)

    const bgLight = lighten(bg, 0.3)
    el.style.setProperty('--manage-bg-gradient',
      `linear-gradient(160deg, ${bg} 0%, ${bgLight} 40%, ${bg} 70%, ${bgLight} 100%)`)
    el.style.background = `linear-gradient(160deg, ${bg} 0%, ${bgLight} 40%, ${bg} 70%, ${bgLight} 100%)`
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
