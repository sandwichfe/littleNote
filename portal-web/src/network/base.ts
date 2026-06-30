import { request } from './request'
import { cipherText } from '@/utils/aesUtil'

const USER_API = '/api/portal/user'
const QR_CODE_LOGIN_API = `${USER_API}/qrCode/login`
const AUTH_API = '/api/portal/auth'

interface RegisterParams {
  username: string
  password: string
  email?: string
}

interface AuthCodeParams {
  clientId: string
  loginToken: string
  redirectUri: string
  state: string
}

export function userLogin(username: string, password: string): Promise<any> {
  const encryptedPassword = cipherText(password)
  return request({
    url: `${USER_API}/login`,
    method: 'post',
    params: {
      username,
      password: encryptedPassword
    }
  })
}

export function userRegister(params: RegisterParams): Promise<any> {
  return request({
    url: `${USER_API}/register`,
    method: 'post',
    data: params
  })
}

export function generateQrCode(): Promise<any> {
  return request({
    method: 'get',
    url: `${QR_CODE_LOGIN_API}/generateQrCode`
  })
}

export const qrCoderStatus = (qrCodeId: string) =>
  request({ method: 'get', url: `${QR_CODE_LOGIN_API}/fetch/${qrCodeId}` })

/**
 * 生成授权码（用于子应用授权登录）
 * @param params - 授权码参数
 */
export function generateAuthCode(params: AuthCodeParams): Promise<any> {
  return request({
    url: `${AUTH_API}/code`,
    method: 'post',
    data: params
  })
}
