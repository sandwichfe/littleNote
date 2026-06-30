import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'
import { redirectToLogin, isAuthCallback } from '@/utils/auth'

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

// 处理401未授权：清除token并跳转到登录页
function handleUnauthorized(message?: string): void {
  Cookies.remove(LOGIN_TOKEN_KEY)

  if (isRedirecting) return

  // 【认证回调保护】如果正在处理OAuth回调，不跳转登录，避免打断认证流程
  if (isAuthCallback()) {
    console.log('===== [请求拦截器] 正在处理OAuth回调，不跳转登录 =====')
    return
  }

  isRedirecting = true
  ElMessage.error(message || UNAUTHORIZED_MESSAGE)

  // 使用OAuth授权码模式跳转到Portal登录页
  setTimeout(() => {
    redirectToLogin()
  }, 1000)
}
