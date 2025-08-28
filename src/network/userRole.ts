// src/network/userRole.ts
import { SysRequest } from './request'

export const getRolesByUserId = (userId: number) => SysRequest({ method: 'get', url: `/user-role/getRolesByUserId/${userId}` })

export const assignRolesToUser = (userId: number, roleIds: number[]) => SysRequest({ method: 'post', url: '/user-role/assignRolesToUser', data: { userId, roleIds } })