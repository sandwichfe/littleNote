import { request } from "./request";

// 服务端按 bizType 决定存储目录，目录不再由前端拼
export type OssBizType = "note-image" | "avatar" | "attachment" | "contract";

export interface UploadVo {
  bucket: string;
  // 桶内对象 key，不含桶名、域名和前导斜杠，业务字段/正文都存它
  objectKey: string;
  size: number;
  contentType: string;
  // 仅用于上传后立即回显，不入库
  url: string;
}

// 批量签名单次上限，与后端 PresignedUrlBatchRequest.MAX_BATCH_SIZE 保持一致
export const MAX_PRESIGN_BATCH_SIZE = 200;

// 通用文件上传接口
export function uploadFile(
  file: File,
  bizType: OssBizType = "note-image",
  // 可选上传进度回调，返回 0~100 的整数
  onUploadProgress?: (percent: number) => void,
): Promise<any> {
  const formData = new FormData();
  // 后端接口固定读取 uploadFile 字段。
  formData.append("uploadFile", file);
  formData.append("bizType", bizType);

  return request({
    method: "post",
    url: "/api/oss/upload",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: onUploadProgress
      ? (event) => {
          if (!event.total) return;
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      : undefined
  });
}

// 批量换取私有桶的临时访问地址，objectKeys 不能为空且不超过 MAX_PRESIGN_BATCH_SIZE
export function getPresignedUrls(objectKeys: string[], expireSeconds = 1800): Promise<any> {
  const bucket = import.meta.env.VITE_OSS_BUCKET;

  return request({
    method: "post",
    url: "/api/oss/presigned-urls",
    data: {
      ...(bucket ? { bucket } : {}),
      objectKeys: objectKeys.map((key) => key.replace(/^\/+/, "")),
      expireSeconds
    }
  });
}
