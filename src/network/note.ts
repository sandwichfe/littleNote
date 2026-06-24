import { request } from "./request";

const NOTE_API = "/api/little-note/note";

export interface Note {
  id: number;
  title: string;
  content: string;
  createTime?: string;
  updateTime?: string;
}

// 笔记接口
export function listNote(pageNum: number, pageSize: number, groupId?: number, keyword?: string): Promise<any> {
  return request({
    method: "post",
    url: `${NOTE_API}/listNote`,
    params: {
      pageNum,
      pageSize,
      groupId,
      keyword
    }
  });
}

export function getNote(id: number): Promise<any> {
  return request({
    method: "get",
    url: `${NOTE_API}/getNote`,
    params: {
      id
    }
  });
}

export function editNote(id: number, content: string, title: string, groupId?: number): Promise<any> {
  return request({
    method: "post",
    url: `${NOTE_API}/editNote`,
    data: {
      id,
      content,
      title,
      groupId
    }
  });
}

export function addNote(id: number, content: string, title: string, groupId?: number): Promise<any> {
  return request({
    method: "post",
    url: `${NOTE_API}/addNote`,
    data: {
      id,
      content,
      title,
      groupId
    }
  });
}

export function deleteNoteItem(id: number): Promise<any> {
  return request({
    method: "get",
    url: `${NOTE_API}/deleteNote`,
    params: {
      id
    }
  });
}