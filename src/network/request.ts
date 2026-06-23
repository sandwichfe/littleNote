import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'
import router from '../router'

type ModuleConfig = {
  prefix: string
  baseURL?: string
}

type RequestConfig = AxiosRequestConfig & {
  url?: string
}

type ResolvedRequestUrl = {
  baseURL?: string
  url: string
}

const REQUEST_TIMEOUT = 60000
const LOGIN_TOKEN_KEY = 'loginToken'
const UNAUTHORIZED_CODE = 401
const SYS_WARN_CODE = 0
const UNAUTHORIZED_MESSAGE = '登录已过期，请重新登录'

const MODULE_CONFIGS: ModuleConfig[] = [
  {
    prefix: '/api/little-note',
    baseURL: import.meta.env.VITE_API_URL,
  },
  {
    prefix: '/api/user-center',
    baseURL: import.meta.env.VITE_USER_CENTER_API_BASE_URL,
  },
  {
    prefix: '/api/sys',
    baseURL: import.meta.env.VITE_SYS_API_URL,
  },
  {
    prefix: '/api/oss',
    baseURL: import.meta.env.VITE_UPLOAD_BASE_URL,
  },
]

let isRedirecting = false

const service = axios.create({
  timeout: REQUEST_TIMEOUT,
})

// 请求拦截器
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

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data
    const code = getResponseCode(data)

    if (isUnauthorized(code)) {
      handleUnauthorized(getResponseMessage(data))
    }

    return data
  },
  (error) => {
    const response = error?.response
    const data = response?.data
    const code = getResponseCode(data)

    if (isUnauthorized(response?.status) || isUnauthorized(code)) {
      handleUnauthorized(getResponseMessage(data) || UNAUTHORIZED_MESSAGE)
    }

    if (isSysWarn(code)) {
      ElMessage.warning(getResponseMessage(data))
    }

    console.error(error)
    return Promise.reject(error)
  },
)

export function request<T = unknown>(config: RequestConfig = {}): Promise<T> {
  const { baseURL, url } = resolveRequestUrl(config.url)
  const requestConfig: RequestConfig = {
    ...config,
    url,
  }

  if (baseURL !== undefined) {
    requestConfig.baseURL = baseURL
  }

  return service(requestConfig) as Promise<T>
}

export function LittleNoteRequest<T = unknown>(config: RequestConfig): Promise<T> {
  return requestWithModule('/api/little-note', config)
}

export function UserCenterRequest<T = unknown>(config: RequestConfig): Promise<T> {
  return requestWithModule('/api/user-center', config)
}

export function SysRequest<T = unknown>(config: RequestConfig): Promise<T> {
  return requestWithModule('/api/sys', config)
}

export function OssRequest<T = unknown>(config: RequestConfig): Promise<T> {
  return requestWithModule('/api/oss', config)
}

function requestWithModule<T = unknown>(prefix: string, config: RequestConfig = {}): Promise<T> {
  return request<T>({
    ...config,
    url: `${prefix}${ensureLeadingSlash(config.url || '/')}`,
  })
}

function resolveRequestUrl(rawUrl = ''): ResolvedRequestUrl {
  const target = MODULE_CONFIGS.find(({ prefix }) => rawUrl.startsWith(prefix))

  if (!target) {
    return {
      baseURL: undefined,
      url: rawUrl,
    }
  }

  return {
    baseURL: target.baseURL || '',
    url: normalizeRelativeUrl(rawUrl.slice(target.prefix.length)),
  }
}

function normalizeRelativeUrl(url: string): string {
  if (!url) return '/'
  return ensureLeadingSlash(url)
}

function ensureLeadingSlash(url: string): string {
  return url.startsWith('/') ? url : `/${url}`
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

  router
    .push('/login')
    .finally(() => {
      isRedirecting = false
    })
}
