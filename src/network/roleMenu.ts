// src/network/roleMenu.ts
import { SysRequest } from './request'

export const getMenusByRoleId = (roleId: number) => SysRequest({ method: 'get', url: `/role-menu/getMenusByRoleId/${roleId}` })

export const assignMenusToRole = (roleId: number, menuIds: number[]) => SysRequest({ method: 'post', url: '/role-menu/assignMenusToRole', data: { roleId, menuIds } })