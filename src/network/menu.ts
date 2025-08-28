// src/network/menu.ts
import { SysRequest, UserCenterRequest } from './request'

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

export const createMenu = (menu: Menu) => SysRequest({ 
  method: 'post', 
  url: '/menu/create', 
  data: menu 
})

export const getMenuById = (id: number) => SysRequest({ method: 'get', url: `/menu/get/${id}` })

// 导出 getAllMenus 方法
export const getAllMenus = (pageVo: PageVo) => SysRequest({ 
  method: 'post', 
  url: '/menu/list', 
  data: pageVo 
})

export const getTreeMenus = (pageVo: PageVo) => SysRequest({ 
  method: 'get', 
  url: '/menu/tree', 
  params: pageVo 
})

export const updateMenu = (menu: Menu) => SysRequest({ 
  method: 'post', 
  url: '/menu/update', 
  data: menu 
})

export const deleteMenu = (id: number) => SysRequest({ method: 'delete', url: `/menu/delete/${id}` })

// 获取当前用户菜单
export const getCurrentUserMenus = () => UserCenterRequest({ 
  method: 'get', 
  url: '/user/currentUserMenu'
})