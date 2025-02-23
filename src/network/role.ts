// src/network/role.ts
import { LoginRequest } from './request'

interface Role {
  id?: number
  name: string
  description: string
}

export const createRole = (role: Role) => LoginRequest({ method: 'post', url: '/sys/role', data: role })

export const getRoleById = (id: number) => LoginRequest({ method: 'get', url: `/sys/role/${id}` })

export const getAllRoles = () => LoginRequest({ method: 'get', url: '/sys/role' })

export const updateRole = (role: Role) => LoginRequest({ method: 'put', url: '/sys/role', data: role })

export const deleteRole = (id: number) => LoginRequest({ method: 'delete', url: `/sys/role/${id}` })