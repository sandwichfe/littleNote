import { request } from './request'

export const listOperationLogs = (data: any) =>
  request({ method: 'post', url: '/api/portal/sys/operation-log/list', data })
