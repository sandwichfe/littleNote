import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'
import router from '../router'

type RequestConfig = AxiosRequestConfig & {
  url?: string
}

const REQUEST_TIMEOUT = 60000
const LOGIN_TOKEN_KEY = 'loginToken'
const UNAUTHORIZED_CODE = 401
const SYS_WARN_CODE = 0
const UNAUTHORIZED_MESSAGE = '登录已过期，请重新登录'

let isRedirecting = false

const service = axios.create({
  timeout: REQUEST_TIMEOUT,
})

// 请求拦截器：统一携带登录 token
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = Cookies.get(LOGIN_TOKEN_KEY)

    if (accessToken) {
      config.headers.Authorization = accessToken
    }

    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一返回业务数据并处理登录失效
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data
    return data
  },
  (error) => {
    const response = error?.response
    const data = response?.data
    const code = getResponseCode(data)

    // 处理未认证
    if (isUnauthorized(response?.status)) {
      handleUnauthorized(getResponseMessage(data) || UNAUTHORIZED_MESSAGE)
    }

    // 错误提示
    if (isSysWarn(code)) {
      ElMessage.warning(getResponseMessage(data))
    }

    console.error(error)
    return Promise.reject(error)
  },
)

export function request<T = unknown>(config: RequestConfig = {}): Promise<T> {
  return service(config) as Promise<T>
}

function isUnauthorized(code: unknown): boolean {
  return Number(code) === UNAUTHORIZED_CODE
}

function isSysWarn(code: unknown): boolean {
  return Number(code) === SYS_WARN_CODE
}

function getResponseCode(data: unknown): unknown {
  return isRecord(data) ? data.code : undefined
}

function getResponseMessage(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined

  if (typeof data.msg === 'string') return data.msg
  if (typeof data.message === 'string') return data.message

  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function handleUnauthorized(message?: string): void {
  Cookies.remove(LOGIN_TOKEN_KEY)

  if (isRedirecting) return

  isRedirecting = true
  ElMessage.error(message || UNAUTHORIZED_MESSAGE)

  // 创建iframe加载Portal登录页
  const iframe = document.createElement('iframe')
  iframe.id = 'portal-login-iframe'
  iframe.src = 'http://localhost:9000/login?mode=iframe'
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:#fff;'
  document.body.appendChild(iframe)

  // 监听Portal回传的token
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== 'http://localhost:9000') return

    if (event.data.type === 'LOGIN_SUCCESS') {
      const token = event.data.token
      Cookies.set(LOGIN_TOKEN_KEY, token, { expires: 7 })

      // 移除iframe和监听器
      const iframeEl = document.getElementById('portal-login-iframe')
      if (iframeEl) {
        document.body.removeChild(iframeEl)
      }
      window.removeEventListener('message', handleMessage)
      isRedirecting = false

      // 刷新页面
      window.location.reload()
    }
  }

  window.addEventListener('message', handleMessage)
}
