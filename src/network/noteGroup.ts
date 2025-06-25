import { request, LoginRequest } from "./request";

// 定义NoteGroup接口
export interface NoteGroup {
  id?: number;
  groupName: string;
}

// 获取标签组列表
export function listNoteGroup(pageNum: number, pageSize: number): Promise<any> {
    return request({
      method: "post",
      url: "/noteGroup/listNoteGroup",
      params: {
        pageNum: pageNum,
        pageSize: pageSize,
      }
    });
}

// 添加标签组
export function addNoteGroup(groupName: string): Promise<any> {
  return request({
    method: "post",
    url: "/noteGroup/addNoteGroup",
    data: {
      groupName: groupName
    }
  });
}

// 编辑标签组
export function editNoteGroup(id: number, groupName: string): Promise<any> {
  return request({
    method: "post",
    url: "/noteGroup/editNoteGroup",
    data: {
      id: id,
      groupName: groupName
    }
  });
}

// 获取单个标签组
export function getNoteGroup(id: number): Promise<any> {
  return request({
    method: "get",
    url: "/noteGroup/getNoteGroup",
    params: {
      id: id
    }
  });
}

// 删除标签组
export function deleteNoteGroup(id: number): Promise<any> {
  return request({
    method: "get",
    url: "/noteGroup/deleteNoteGroup",
    params: {
      id: id
    }
  });
}