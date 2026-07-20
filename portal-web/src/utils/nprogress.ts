/**
 * 顶栏细进度条（YouTube / GitHub 风格）
 * - start：请求开始，快速推到约 80%
 * - done：全部结束后走完并淡出
 * - 用计数支持并发请求
 */

type ProgressListener = (active: boolean) => void

let pendingCount = 0
let progress = 0
let trickleTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let barEl: HTMLDivElement | null = null
let pegEl: HTMLDivElement | null = null
let visible = false

const listeners = new Set<ProgressListener>()

function ensureBar(): HTMLDivElement {
  if (barEl && document.body.contains(barEl)) {
    return barEl
  }

  // 进度条容器：fixed 贴顶，不占文档流
  const bar = document.createElement('div')
  bar.className = 'app-nprogress'
  bar.setAttribute('role', 'progressbar')
  bar.setAttribute('aria-hidden', 'true')

  const peg = document.createElement('div')
  peg.className = 'app-nprogress__peg'
  bar.appendChild(peg)

  document.body.appendChild(bar)
  barEl = bar
  pegEl = peg
  return bar
}

function setProgress(value: number) {
  progress = Math.max(0, Math.min(value, 1))
  const bar = ensureBar()
  bar.style.transform = `scaleX(${progress})`
}

function clearTrickle() {
  if (trickleTimer != null) {
    clearTimeout(trickleTimer)
    trickleTimer = null
  }
}

function clearHide() {
  if (hideTimer != null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function notify(active: boolean) {
  listeners.forEach((fn) => fn(active))
}

/** 缓慢推进，避免长时间卡在同一位置 */
function scheduleTrickle() {
  clearTrickle()
  trickleTimer = setTimeout(() => {
    if (pendingCount <= 0) return
    // 越接近 0.9 推进越慢
    const remain = 0.9 - progress
    if (remain > 0.01) {
      setProgress(progress + remain * 0.08)
      scheduleTrickle()
    }
  }, 400)
}

function show() {
  clearHide()
  const bar = ensureBar()
  bar.classList.add('is-active')
  bar.classList.remove('is-done')
  if (!visible) {
    visible = true
    setProgress(0)
    // 强制 reflow，保证从 0 起动画
    void bar.offsetWidth
  }
  setProgress(Math.max(progress, 0.12))
  scheduleTrickle()
  notify(true)
}

function hide() {
  clearTrickle()
  const bar = ensureBar()
  setProgress(1)
  bar.classList.add('is-done')
  clearHide()
  hideTimer = setTimeout(() => {
    bar.classList.remove('is-active', 'is-done')
    setProgress(0)
    visible = false
    notify(false)
  }, 280)
}

/** 开始一次加载（可重入，按计数） */
export function startProgress() {
  pendingCount += 1
  if (pendingCount === 1) {
    show()
  } else if (progress < 0.85) {
    // 并发追加时略微推进
    setProgress(progress + 0.04)
  }
}

/** 结束一次加载；全部结束后才收起 */
export function doneProgress() {
  pendingCount = Math.max(0, pendingCount - 1)
  if (pendingCount === 0) {
    hide()
  }
}

/** 强制结束（路由异常等） */
export function forceDoneProgress() {
  pendingCount = 0
  if (visible) {
    hide()
  }
}

export function onProgressChange(listener: ProgressListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
