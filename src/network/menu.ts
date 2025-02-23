// src/network/menu.ts
import { LoginRequest } from './request'

interface Menu {
  id?: number
  name: string
  menuPid?: number
  url?: string
  authority?: string
  sort?: number
  type?: number
  deleted?: boolean
  createTime?: string
  createUserId?: number
}

interface PageVo {
  pageNum: number
  pageSize: number
}

export const createMenu = (menu: Menu) => LoginRequest({ 
  method: 'post', 
  url: '/sys/menu/create', 
  data: menu 
})

export const getMenuById = (id: number) => LoginRequest({ method: 'get', url: `/sys/menu/get/${id}` })

export const getAllMenus = (pageVo: PageVo) => LoginRequest({ method: 'post', url: '/sys/menu/list', data: pageVo })

export const updateMenu = (menu: Menu) => LoginRequest({ 
  method: 'post', 
  url: '/sys/menu/update', 
  data: menu 
})

export const deleteMenu = (id: number) => LoginRequest({ method: 'delete', url: `/sys/menu/delete/${id}` })