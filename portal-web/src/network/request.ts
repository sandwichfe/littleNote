import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'
import router from '../router'
import { doneProgress, startProgress } from '@/utils/nprogress'

type RequestConfig = AxiosRequestConfig & {
  url?: string
  /** 为 true 时不展示顶栏进度条（轮询等静默请求） */
  silent?: boolean
}

type InternalRequestConfig = InternalAxiosRequestConfig & {
  silent?: boolean
  /** 本请求是否已触发进度条 start，用于配对 done */
  __progressStarted?: boolean
}

const REQUEST_TIMEOUT = 60000
const LOGIN_TOKEN_KEY = 'loginToken'
const UNAUTHORIZED_CODE = 401
const SYS_WARN_CODE = 0
const UNAUTHORIZED_MESSAGE = '登录已过期，请重新登录'

let isRedirecting = false

const service = axios.create({
  timeout: REQUEST_TIMEOUT
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const nextConfig = config as InternalRequestConfig
    const accessToken = Cookies.get(LOGIN_TOKEN_KEY)
    if (accessToken) {
      nextConfig.headers.Authorization = accessToken
    }

    // 默认展示顶栏进度；silent 请求跳过
    if (!nextConfig.silent) {
      startProgress()
      nextConfig.__progressStarted = true
    }

    return nextConfig
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    finishRequestProgress(response.config as InternalRequestConfig)
    return response.data
  },
  (error) => {
    finishRequestProgress(error?.config as InternalRequestConfig | undefined)

    const response = error?.response
    const data = response?.data
    const code = getResponseCode(data)

    if (isUnauthorized(response?.status)) {
      handleUnauthorized(getResponseMessage(data) || UNAUTHORIZED_MESSAGE)
    }

    if (isSysWarn(code)) {
      ElMessage.warning(getResponseMessage(data))
    }

    console.error(error)
    return Promise.reject(error)
  }
)

/** 与 start 配对结束进度条 */
function finishRequestProgress(config?: InternalRequestConfig) {
  if (config?.__progressStarted) {
    doneProgress()
    config.__progressStarted = false
  }
}

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
  router.push('/login').finally(() => {
    isRedirecting = false
  })
}
