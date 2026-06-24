// src/network/roleMenu.ts
import { request } from '../request'

export const getMenusByRoleId = (roleId: number) => request({ method: 'get', url: `/api/portal/sys/role-menu/getMenusByRoleId/${roleId}` })

export const assignMenusToRole = (roleId: number, menuIds: number[]) => request({ method: 'post', url: '/api/portal/sys/role-menu/assignMenusToRole', data: { roleId, menuIds } })
