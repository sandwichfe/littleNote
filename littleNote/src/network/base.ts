import { request } from "./request";
import { cipherText } from "../utils/aesUtil";

const USER_API = "/api/portal/user";
const QR_CODE_LOGIN_API = `${USER_API}/qrCode/login`;


interface RegisterParams {
  username: string;
  password: string;
  email?: string;
}

// 用户登录
export function userLogin(username: string, password: string): Promise<any> {
  const encryptedPassword = cipherText(password);

  return request({
    url: `${USER_API}/login`,
    method: "post",
    params: {
      username,
      password: encryptedPassword
    }
  });
}

// 用户注册
export function userRegister(params: RegisterParams): Promise<any> {
  return request({
    url: `${USER_API}/register`,
    method: "post",
    data: params
  });
}

// 二维码登录接口
export function generateQrCode(): Promise<any> {
  return request({
    method: "get",
    url: `${QR_CODE_LOGIN_API}/generateQrCode`
  });
}

// 二维码登录状态查询接口
export const qrCoderStatus = (qrCodeId: string) => request({ method: "get", url: `${QR_CODE_LOGIN_API}/fetch/${qrCodeId}` });


