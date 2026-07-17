// src/network/menu.ts
import { request } from '../request'

export interface Menu {
  id?: number
  name: string
  menuPid?: number // 父级菜单ID
  url?: string
  path?: string
  title?: string
  icon?: string
  permission?: string
  children?: Menu[]
  authority?: string
  sort?: number
  type?: number
  deleted?: boolean
  createTime?: string
  createUserId?: number
}

interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

// 列表 / 树查询参数：分页 + 可选筛选（后端未接字段时会被忽略）
interface MenuListQuery {
  pageNum: number
  pageSize: number
  name?: string
  path?: string
  type?: number | string
}

export const createMenu = (menu: Menu) => request({
  method: 'post',
  url: '/api/portal/sys/menu/create',
  data: menu
})

export const getMenuById = (id: number) => request({ method: 'get', url: `/api/portal/sys/menu/get/${id}` })

// 导出 getAllMenus 方法
export const getAllMenus = (pageVo: MenuListQuery) => request({
  method: 'post',
  url: '/api/portal/sys/menu/list',
  data: pageVo
})

export const getTreeMenus = (pageVo: MenuListQuery) => request({
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
export const getCurrentUserMenus = () => request<ApiResponse<Menu[]>>({
  method: 'get', 
  url: '/api/portal/userCenter/currentUserMenu'
})
