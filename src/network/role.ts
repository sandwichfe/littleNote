// src/network/role.ts
import { SysRequest } from './request'

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

export const createRole = (role: { id?: number, roleName: string, description?: string }) => SysRequest({ 
  method: 'post', 
  url: '/role/create', 
  data: { 
    id: role.id, 
    roleName: role.roleName,
    description: role.description
  } 
})

export const getRoleById = (id: number) => SysRequest({ method: 'get', url: `/role/get/${id}` })

export const getAllRoles = (pageVo: PageVo) => SysRequest({ method: 'post', url: '/role/list', data: pageVo })

export const updateRole = (role: { id?: number, roleName: string, description?: string }) => SysRequest({ 
  method: 'post', 
  url: '/role/update', 
  data: { 
    id: role.id, 
    roleName: role.roleName,
    description: role.description
  } 
})

export const deleteRole = (id: number) => SysRequest({ method: 'delete', url: `/role/delete/${id}` })
