// src/network/userRole.ts
import { request } from '../request'

export const getRolesByUserId = (userId: number) => request({ method: 'get', url: `/api/portal/sys/user-role/getRolesByUserId/${userId}` })

export const assignRolesToUser = (userId: number, roleIds: number[]) => request({ method: 'post', url: '/api/portal/sys/user-role/assignRolesToUser', data: { userId, roleIds } })
