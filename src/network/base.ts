import { request, LoginRequest } from "./request";

// 定义接口类型，明确返回的数据结构
interface NoteResponse {
  content: string | null;
  // 你可以根据实际返回数据扩展更多字段
}

interface Note {
  id: number;
  title: string;
  content: string;
}

// 这里为列表和分页功能添加类型
export function listNote(pageNum: number, pageSize: number): Promise<Note[]> {
  return request({
    method: "post",
    url: "/note/listNote",
    params: {
      pageNum: pageNum,
      pageSize: pageSize,
    }
  });
}

// 获取单个笔记，返回类型为 NoteResponse
export function getNote(id: number): Promise<NoteResponse> {
  return request({
    method: "get",
    url: "/note/getNote",
    params: {
      id: id,
    }
  });
}

// 编辑笔记，返回类型仍然为 NoteResponse 或 void，取决于实际需求
export function editNote(id: number, content: string, title: string): Promise<void> {
  return request({
    method: "post",
    url: "/note/editNote",
    data: {
      id: id,
      content: content,
      title: title
    }
  });
}

// 添加新笔记
export function addNote(id: number, content: string, title: string): Promise<void> {
  return request({
    method: "post",
    url: "/note/addNote",
    data: {
      id: id,
      content: content,
      title: title
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

export function login(username: string, password: string): Promise<LoginResponse> {
  return LoginRequest({
    url: '/user/login',
    method: 'post',
    params: {
      username,
      password
    }
  });
}
