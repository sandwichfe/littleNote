// src/network/menu.ts
import { request } from './request'

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

export const createMenu = (menu: Menu) => request({ 
  method: 'post', 
  url: '/api/portal/sys/menu/create', 
  data: menu 
})

export const getMenuById = (id: number) => request({ method: 'get', url: `/api/portal/sys/menu/get/${id}` })

// 导出 getAllMenus 方法
export const getAllMenus = (pageVo: PageVo) => request({ 
  method: 'post', 
  url: '/api/portal/sys/menu/list', 
  data: pageVo 
})

export const getTreeMenus = (pageVo: PageVo) => request({ 
  method: 'get', 
  url: '/api/portal/sys/menu/tree', 
  params: pageVo 
})

export const updateMenu = (menu: Menu) => request({ 
  method: 'post', 
  url: '/api/portal/sys/menu/update', 
  data: menu 
})

export const deleteMenu = (id: number) => request({ method: 'delete', url: `/api/portal/sys/menu/delete/${id}` })

// 获取当前用户菜单
export const getCurrentUserMenus = () => request({ 
  method: 'get', 
  url: '/api/portal/userCenter/currentUserMenu'
})
