import { request } from './request'

// 通用文件上传：后端固定读取 uploadFile 字段
export function uploadImage(file: File): Promise<{ data: string }> {
  const formData = new FormData()
  formData.append('uploadFile', file)

  return request({
    method: 'post',
    url: '/api/oss/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
