import { request, LoginRequest } from "./request";


export interface Note {
  id: number;
  title: string;
  content: string;
  createTime?: string;
  updateTime?: string;
}

// 这里为列表和分页功能添加类型
export function listNote(pageNum: number, pageSize: number,groupId?:number,keyword?:string): Promise<any> {
  return request({
    method: "post",
    url: "/note/listNote",
    params: {
      pageNum: pageNum,
      pageSize: pageSize,
      groupId:groupId,
      keyword:keyword
    }
  });
}

// 获取单个笔记，返回类型为 NoteResponse
export function getNote(id: number): Promise<any> {
  return request({
    method: "get",
    url: "/note/getNote",
    params: {
      id: id,
    }
  });
}

// 编辑笔记，返回类型仍然为 NoteResponse 或 void，取决于实际需求
export function editNote(id: number, content: string, title: string,groupId?: number): Promise<any> {
  return request({
    method: "post",
    url: "/note/editNote",
    data: {
      id: id,
      content: content,
      title: title,
      groupId:groupId
    }
  });
}

// 添加新笔记
export function addNote(id: number, content: string, title: string,groupId?: number): Promise<any> {
  return request({
    method: "post",
    url: "/note/addNote",
    data: {
      id: id,
      content: content,
      title: title,
      groupId:groupId
    }
  });
}

// 删除笔记
export function deleteNoteItem(id: number): Promise<any> {
  return request({
    method: "get",
    url: "/note/deleteNote",
    params: {
      id: id,
    }
  });
}

// 登录函数，返回类型可以为登录请求的响应结构
interface LoginResponseData {
  token: string;
  // 可以添加其他字段，如用户信息等
}

export interface LoginResponse {
  code: number;
  msg?: string;
  data: LoginResponseData;
}

export function userLogin(username: string, password: string): Promise<any> {
  return LoginRequest({
    url: '/user/login',
    method: 'post',
    params: {
      username,
      password
    }
  });
}

// 新增生成滑块验证数据的方法
export function generateSlider(): Promise<any> {
  return LoginRequest({
    method: "get",
    url: "/user/slider/generate",
  });
}

// 新增验证滑块位置的方法
export function verifySlider(sliderId: string, userX: number): Promise<any> {
  return LoginRequest({
    method: "post",
    url: "/user/slider/verify",
    params: {
      sliderId,
      userX
    }
  });
}


// 新增生成滑块验证数据的方法
export function generateQrCode(): Promise<any> {
  return LoginRequest({
    method: "get",
    url: "/user/qrCode/login/generateQrCode",
    params: {
    }
  });
}



// 修改检查二维码状态接口
export const qrCoderStatus = (qrCodeId: string) => LoginRequest({ method: 'get', url: `/user/qrCode/login/fetch/${qrCodeId}`})


// 新增用户注册接口
interface RegisterParams {
  username: string;
  password: string;
  email?: string;
}

export function userRegister(params: RegisterParams): Promise<any> {
  return LoginRequest({
    url: '/user/register',
    method: 'post',
    data: params
  });
}

export function uploadImage(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('uploadFile', file);
  return request({
    method: 'post',
    url: '/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}