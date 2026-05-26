import { SysRequest } from './request'

export const listOperationLogs = (data: any) =>
  SysRequest({ method: 'post', url: '/operation-log/list', data })

