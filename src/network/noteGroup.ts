import { request, LoginRequest } from "./request";

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