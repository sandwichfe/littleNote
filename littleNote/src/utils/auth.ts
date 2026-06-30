import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'

const PORTAL_LOGIN_URL = import.meta.env.VITE_PORTAL_LOGIN_URL
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID

// 认证初始化状态管理
let authInitPromise: Promise<boolean> | null = null
let authInitialized = false

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  return !!Cookies.get('loginToken')
}

/**
 * 等待认证初始化完成
 * 用于路由守卫等需要等待认证流程完成的场景
 */
export async function waitForAuthInit(): Promise<boolean> {
  if (authInitialized) {
    return true
  }
  if (authInitPromise) {
    await authInitPromise
    return true
  }
  return true
}

/**
 * 检查当前URL是否为OAuth回调
 */
export function isAuthCallback(): boolean {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.has('code') && urlParams.has('state')
}

/**
 * 获取当前token
 */
export function getToken(): string | undefined {
  return Cookies.get('loginToken')
}

/**
 * 跳转到Portal统一登录页
 * @param redirect - 登录成功后回跳的URL（默认为当前页面）
 */
export function redirectToLogin(redirect?: string) {
  // 清理当前URL的code和state参数，获取干净的redirectUri
  const currentUrl = new URL(window.location.href)
  currentUrl.searchParams.delete('code')
  currentUrl.searchParams.delete('state')
  const redirectUri = redirect || currentUrl.toString()
  const state = generateState()

  // 将state和redirectUri保存到sessionStorage，用于回调时校验
  sessionStorage.setItem('auth_state', state)
  sessionStorage.setItem('auth_redirect_uri', redirectUri)

  const loginUrl = `${PORTAL_LOGIN_URL}?client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`

  console.log('=== littleNote跳转登录 ===');
  console.log('redirectUri:', redirectUri);
  console.log('state:', state);
  console.log('loginUrl:', loginUrl);

  window.location.href = loginUrl
}

/**
 * 处理授权码回调
 * @returns Promise<boolean> - 是否成功获取token
 */
export async function handleAuthCallback(): Promise<boolean> {
  // 如果已经初始化过，直接返回
  if (authInitialized) {
    return false
  }

  // 如果正在初始化，等待完成
  if (authInitPromise) {
    return await authInitPromise
  }

  // 创建初始化Promise
  authInitPromise = (async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')

      // 没有授权码参数，不是回调页面
      if (!code || !state) {
        console.log('===== 没有code或state，跳过处理 =====');
        return false
      }

      return await processAuthCallback(code, state)
    } finally {
      // 无论成功失败，都标记为已初始化
      authInitialized = true
    }
  })()

  return await authInitPromise
}

/**
 * 实际处理OAuth回调逻辑
 */
async function processAuthCallback(code: string, state: string): Promise<boolean> {

  // 校验state，防止CSRF攻击
  const savedState = sessionStorage.getItem('auth_state')
  console.log('savedState:', savedState, '=====');

  if (state !== savedState) {
    console.error('===== [阶段6] state校验失败 =====');
    ElMessage.error('登录校验失败，请重试')
    // 清理sessionStorage
    sessionStorage.removeItem('auth_state')
    sessionStorage.removeItem('auth_redirect_uri')
    throw new Error('State validation failed')
  }

  console.log('===== [阶段7] state校验成功，准备换取token =====')

  try {
    // 调用后端接口，用授权码换取token
    console.log('===== [阶段8] 开始换取token，时间:', new Date().toISOString(), '=====')
    const startTime = Date.now()

    const response = await exchangeCodeForToken(code, CLIENT_ID)

    const endTime = Date.now()
    console.log('===== [阶段9] 换取token完成，耗时:', endTime - startTime, 'ms =====')
    console.log('===== [阶段9] 响应数据:', response, '=====')

    if (response && response.code === 200) {
      console.log('===== [阶段10] token换取成功，开始保存 =====')

      // 保存token到Cookie
      Cookies.set('loginToken', response.data.token, { expires: 7 })
      console.log('===== [阶段11] token已保存到Cookie =====')

      // 清理sessionStorage
      sessionStorage.removeItem('auth_state')
      sessionStorage.removeItem('auth_redirect_uri')
      console.log('===== [阶段12] 已清理sessionStorage =====')

      console.log('===== [阶段13] 登录流程完成，URL参数将由路由守卫清理 =====')
      return true
    } else {
      console.error('===== [阶段15] exchange接口返回失败 =====', response)

      // exchange接口调用失败，直接抛出异常阻止后续代码执行
      const errorMsg = response?.msg || '登录失败'
      ElMessage.error(errorMsg)
      sessionStorage.removeItem('auth_state')
      sessionStorage.removeItem('auth_redirect_uri')
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('===== [阶段16] 异常捕获 =====', error)

    console.error('===== [阶段17] 错误详情 =====', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      response: error?.response
    })

    // exchange接口调用异常，清理存储避免状态混乱
    sessionStorage.removeItem('auth_state')
    sessionStorage.removeItem('auth_redirect_uri')
    console.log('===== [阶段18] 已清理sessionStorage =====')

    // 判断是否是超时错误
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      console.error('===== [阶段19] 识别为超时错误 =====')
      ElMessage.error('请求超时，请检查网络连接后重新登录')
    } else if (!error?.message?.includes('登录失败')) {
      console.error('===== [阶段19] 识别为通用错误 =====')
      // 如果不是业务错误（response.code !== 200），才显示通用错误提示
      ElMessage.error('登录失败，请重新登录')
    }

    console.error('===== [阶段20] 准备抛出异常 =====')
    // 抛出异常，阻止后续代码执行
    throw error
  }
}

/**
 * 用授权码换取token
 * @param code - 授权码
 * @param clientId - 客户端ID
 */
async function exchangeCodeForToken(code: string, clientId: string) {
  const { exchangeCodeForToken: exchangeApi } = await import('../network/base')
  // 使用保存的原始redirectUri，确保与后端记录的一致
  const redirectUri = sessionStorage.getItem('auth_redirect_uri') || window.location.origin
  return exchangeApi(code, clientId, redirectUri)
}

/**
 * 生成随机state，用于防止CSRF攻击
 */
function generateState(): string {
  return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 清理URL中的授权相关参数
 */
function cleanAuthParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')

  // 使用replaceState不会触发页面刷新
  window.history.replaceState({}, '', url.toString())
}

/**
 * 退出登录 - 仅清除本地token,不跳转
 */
export function logout() {
  Cookies.remove('loginToken')
  // 清除sessionStorage中的state
  sessionStorage.removeItem('auth_state')
}
