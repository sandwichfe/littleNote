import { request } from "./request";

// 通用文件上传接口
export function uploadImage(file: File): Promise<any> {
  const formData = new FormData();
  // 后端接口固定读取 uploadFile 字段。
  formData.append("uploadFile", file);

  return request({
    method: "post",
    url: "/api/oss/upload",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}