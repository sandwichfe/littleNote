import { SysRequest } from './request'

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
  SysRequest({ method: 'post', url: '/dict-type/create', data: payload })

export const updateDictType = (payload: DictType) =>
  SysRequest({ method: 'post', url: '/dict-type/update', data: payload })

export const deleteDictType = (id: number) =>
  SysRequest({ method: 'delete', url: `/dict-type/delete/${id}` })

export const listDictTypes = (query: DictTypePageQuery) =>
  SysRequest({ method: 'post', url: '/dict-type/list', data: query })

export const getAllDictTypes = () =>
  SysRequest({ method: 'get', url: '/dict-type/all' })

export const createDictItem = (payload: DictItem) =>
  SysRequest({ method: 'post', url: '/dict-item/create', data: payload })

export const updateDictItem = (payload: DictItem) =>
  SysRequest({ method: 'post', url: '/dict-item/update', data: payload })

export const deleteDictItem = (id: number) =>
  SysRequest({ method: 'delete', url: `/dict-item/delete/${id}` })

export const listDictItems = (query: DictItemPageQuery) =>
  SysRequest({ method: 'post', url: '/dict-item/list', data: query })

export const getAllDictItems = (dictTypeId: number) =>
  SysRequest({ method: 'get', url: `/dict-item/all/${dictTypeId}` })

