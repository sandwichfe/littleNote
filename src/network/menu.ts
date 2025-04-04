// src/network/menu.ts
import { LoginRequest } from './request'

interface Menu {
  id?: number
  name: string
  menuPid?: number // 父级菜单ID
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

// 导出 getAllMenus 方法
export const getAllMenus = (pageVo: PageVo) => LoginRequest({ 
  method: 'post', 
  url: '/sys/menu/list', 
  data: pageVo 
})

export const getTreeMenus = (pageVo: PageVo) => LoginRequest({ 
  method: 'get', 
  url: '/sys/menu/tree', 
  data: pageVo 
})

export const updateMenu = (menu: Menu) => LoginRequest({ 
  method: 'post', 
  url: '/sys/menu/update', 
  data: menu 
})

export const deleteMenu = (id: number) => LoginRequest({ method: 'delete', url: `/sys/menu/delete/${id}` })

// 获取当前用户菜单
export const getCurrentUserMenus = () => LoginRequest({ 
  method: 'get', 
  url: '/sys/menu/current'
})