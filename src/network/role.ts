// src/network/role.ts
import { request } from './request'

interface Role {
  id?: number
  roleName: string
  description?: string
  deleted?: boolean
  sort?: number
  createTime?: string
  createUserId?: number
}

interface PageVo {
  pageNum: number
  pageSize: number
}

export const createRole = (role: { id?: number, roleName: string, description?: string }) => request({ 
  method: 'post', 
  url: '/api/portal/sys/role/create', 
  data: { 
    id: role.id, 
    roleName: role.roleName,
    description: role.description
  } 
})

export const getRoleById = (id: number) => request({ method: 'get', url: `/api/portal/sys/role/get/${id}` })

export const getAllRoles = (pageVo: PageVo) => request({ method: 'post', url: '/api/portal/sys/role/list', data: pageVo })

export const updateRole = (role: { id?: number, roleName: string, description?: string }) => request({ 
  method: 'post', 
  url: '/api/portal/sys/role/update', 
  data: { 
    id: role.id, 
    roleName: role.roleName,
    description: role.description
  } 
})

export const deleteRole = (id: number) => request({ method: 'delete', url: `/api/portal/sys/role/delete/${id}` })
