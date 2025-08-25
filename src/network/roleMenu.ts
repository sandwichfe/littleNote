// src/network/roleMenu.ts
import { LoginRequest } from './request'

export const getMenusByRoleId = (roleId: number) => LoginRequest({ method: 'get', url: `/api/sys/role-menu/getMenusByRoleId/${roleId}` })

export const assignMenusToRole = (roleId: number, menuIds: number[]) => LoginRequest({ method: 'post', url: '/api/sys/role-menu/assignMenusToRole', data: { roleId, menuIds } })