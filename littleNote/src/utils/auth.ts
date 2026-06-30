import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'

const PORTAL_LOGIN_URL = import.meta.env.VITE_PORTAL_LOGIN_URL
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  return !!Cookies.get('loginToken')
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
  const redirectUri = redirect || window.location.href
  const state = generateState()

  // 将state保存到sessionStorage，用于回调时校验
  sessionStorage.setItem('auth_state', state)

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
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')

  // 没有授权码参数，不是回调页面
  if (!code || !state) {
    console.log('没有code或state，跳过处理');
    return false
  }

  // 校验state，防止CSRF攻击
  const savedState = sessionStorage.getItem('auth_state')
  console.log('savedState:', savedState);

  if (state !== savedState) {
    console.error('state校验失败');
    ElMessage.error('登录校验失败，请重试')
    sessionStorage.removeItem('auth_state')
    return false
  }

  try {
    // 调用后端接口，用授权码换取token
    const response = await exchangeCodeForToken(code, CLIENT_ID)

    if (response && response.code === 200) {
      // 保存token到Cookie
      Cookies.set('loginToken', response.data.token, { expires: 7 })

      // 清理URL中的授权码参数
      cleanAuthParams()

      // 清理state
      sessionStorage.removeItem('auth_state')

      return true
    } else {
      ElMessage.error(response?.msg || '登录失败')
      return false
    }
  } catch (error) {
    console.error('Token exchange failed:', error)
    ElMessage.error('登录失败，请重试')
    return false
  }
}

/**
 * 用授权码换取token
 * @param code - 授权码
 * @param clientId - 客户端ID
 */
async function exchangeCodeForToken(code: string, clientId: string) {
  const { exchangeCodeForToken: exchangeApi } = await import('../network/base')
  const redirectUri = window.location.origin + window.location.pathname
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
