// src/network/role.ts
import { LoginRequest } from './request'

interface Role {
  id?: number
  roleName: string
  deleted?: boolean
  sort?: number
  createTime?: string
  createUserId?: number
}

interface PageVo {
  pageNum: number
  pageSize: number
}

export const createRole = (role: { id?: number, roleName: string }) => LoginRequest({ 
  method: 'post', 
  url: '/sys/role/create', 
  data: { 
    id: role.id, 
    roleName: role.roleName 
  } 
})

export const getRoleById = (id: number) => LoginRequest({ method: 'get', url: `/sys/role/get/${id}` })

export const getAllRoles = (pageVo: PageVo) => LoginRequest({ method: 'post', url: '/sys/role/list', data: pageVo })

export const updateRole = (role: { id?: number, roleName: string }) => LoginRequest({ 
  method: 'post', 
  url: '/sys/role/update', 
  data: { 
    id: role.id, 
    roleName: role.roleName 
  } 
})

export const deleteRole = (id: number) => LoginRequest({ method: 'delete', url: `/sys/role/delete/${id}` })