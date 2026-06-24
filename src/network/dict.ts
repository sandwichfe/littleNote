import { request } from './request'

export interface DictType {
  id?: number
  typeCode: string
  typeName: string
  sort?: number
  remark?: string
  createTime?: string
}

export interface DictItem {
  id?: number
  dictTypeId: number
  label: string
  value: string
  sort?: number
  remark?: string
  createTime?: string
}

export interface DictTypePageQuery {
  pageNum: number
  pageSize: number
  keyword?: string
}

export interface DictItemPageQuery {
  pageNum: number
  pageSize: number
  dictTypeId: number
  keyword?: string
}

export const createDictType = (payload: DictType) =>
  request({ method: 'post', url: '/api/portal/sys/dict-type/create', data: payload })

export const updateDictType = (payload: DictType) =>
  request({ method: 'post', url: '/api/portal/sys/dict-type/update', data: payload })

export const deleteDictType = (id: number) =>
  request({ method: 'delete', url: `/api/portal/sys/dict-type/delete/${id}` })

export const listDictTypes = (query: DictTypePageQuery) =>
  request({ method: 'post', url: '/api/portal/sys/dict-type/list', data: query })

export const getAllDictTypes = () =>
  request({ method: 'get', url: '/api/portal/sys/dict-type/all' })

export const createDictItem = (payload: DictItem) =>
  request({ method: 'post', url: '/api/portal/sys/dict-item/create', data: payload })

export const updateDictItem = (payload: DictItem) =>
  request({ method: 'post', url: '/api/portal/sys/dict-item/update', data: payload })

export const deleteDictItem = (id: number) =>
  request({ method: 'delete', url: `/api/portal/sys/dict-item/delete/${id}` })

export const listDictItems = (query: DictItemPageQuery) =>
  request({ method: 'post', url: '/api/portal/sys/dict-item/list', data: query })

export const getAllDictItems = (dictTypeId: number) =>
  request({ method: 'get', url: `/api/portal/sys/dict-item/all/${dictTypeId}` })

