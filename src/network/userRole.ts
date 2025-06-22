// src/network/userRole.ts
import { LoginRequest } from './request'

export const getRolesByUserId = (userId: number) => LoginRequest({ method: 'get', url: `/sys/user-role/getRolesByUserId/${userId}` })

export const assignRolesToUser = (userId: number, roleIds: number[]) => LoginRequest({ method: 'post', url: '/sys/user-role/assignRolesToUser', data: { userId, roleIds } })