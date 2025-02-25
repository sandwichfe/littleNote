import { request, LoginRequest } from "./request";


interface Note {
  id: number;
  title: string;
  content: string;
}

// 这里为列表和分页功能添加类型
export function listNote(pageNum: number, pageSize: number,groupId?:number): Promise<Note[]> {
  return request({
    method: "post",
    url: "/note/listNote",
    params: {
      pageNum: pageNum,
      pageSize: pageSize,
      groupId:groupId
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
export function editNote(id: number, content: string, title: string,groupId?: number): Promise<void> {
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
export function addNote(id: number, content: string, title: string,groupId?: number): Promise<void> {
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
export function deleteNoteItem(id: number): Promise<void> {
  return request({
    method: "get",
    url: "/note/deleteNote",
    params: {
      id: id,
    }
  });
}

// 登录函数，返回类型可以为登录请求的响应结构
interface LoginResponse {
  token: string;
  // 可以添加其他字段，如用户信息等
}

export function userLogin(username: string, password: string): Promise<LoginResponse> {
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
