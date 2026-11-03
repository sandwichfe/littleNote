import { request } from "../request";

const NOTE_API = "/api/little-note/note";

export interface Note {
  id: number;
  title: string;
  // 加解密收敛到后端后，正文只在详情接口返回，列表接口下发纯文本摘要
  content?: string;
  summary?: string;
  // 列表封面：正文第一张图片，本站资源为裸 objectKey（渲染前需换预签名地址），外链原样存
  coverUrl?: string | null;
  // 列表接口带上所属分组名时在条目底部展示
  groupName?: string;
  createTime?: string;
  updateTime?: string;
  highlightTitle?: string | null;
  highlightContent?: string | null;
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

// coverUrl 是正文第一张图片的 objectKey（外链则为原始地址），首页列表用来渲染缩略图；
// 传 null 表示正文里已经没有图片，后端据此清空封面
export function editNote(id: number, content: string, title: string, groupId?: number | null, coverUrl?: string | null): Promise<any> {
  return request({
    method: "post",
    url: `${NOTE_API}/editNote`,
    data: {
      id,
      content,
      title,
      groupId,
      coverUrl
    }
  });
}

// 新建时 id 传 null，groupId 传 null 表示未分组
export function addNote(id: number | null, content: string, title: string, groupId?: number | null, coverUrl?: string | null): Promise<any> {
  return request({
    method: "post",
    url: `${NOTE_API}/addNote`,
    data: {
      id,
      content,
      title,
      groupId,
      coverUrl
    }
  });
}

// 单个分组的笔记数量，没有笔记的分组后端也会返回 0
export interface GroupNoteCount {
  groupId: number;
  groupName: string;
  noteCount: number;
}

// 笔记计数：总数 + 各分组分布，供列表页侧栏展示
export interface NoteCount {
  totalCount: number;
  groupCounts: GroupNoteCount[];
}

export function countNoteByGroup(): Promise<any> {
  return request({
    method: "get",
    url: `${NOTE_API}/countNoteByGroup`
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
