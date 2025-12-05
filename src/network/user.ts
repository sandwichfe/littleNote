// src/network/user.ts
import { SysRequest, UserCenterRequest } from './request'
import { cipherText } from '@/utils/aesUtil'

interface User {
  id?: number
  nickname: string
  username?: string
  password?: string
  mobile?: string
  email?: string
  avatarUrl?: string
  deptIds?: number[]
  deleted?: boolean
  sourceFrom?: string
}

interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface PageVo {
  pageNum: number
  pageSize: number
  deptId?: number
}

export const createUser = (user: User) => SysRequest({ method: 'post', url: '/user/create', data: user })

export const getUserById = (id: number) => SysRequest({ method: 'get', url: `/user/get/${id}` })

export const getAllUsers = (pageVo: PageVo) => SysRequest({ method: 'post', url: '/user/list', data: pageVo })

export const updateUser = (user: User) => SysRequest({ method: 'post', url: '/user/update', data: user })

export const deleteUser = (id: number) => SysRequest({ method: 'delete', url: `/user/delete/${id}` })


export const getCurrentUser = () => UserCenterRequest({ method: 'get', url: `/user/getCurrentUser` })

export const updateCurrentUser = (user: User) => UserCenterRequest({ method: 'post', url: '/user/updateCurrentUser', data: user })

export const changePassword = (changePasswordData: ChangePasswordRequest) => {
  // 对密码进行RSA加密
  const encryptedData = {
    ...changePasswordData,
    oldPassword: cipherText(changePasswordData.oldPassword),
    newPassword: cipherText(changePasswordData.newPassword),
    confirmPassword: cipherText(changePasswordData.confirmPassword)
  }
  return UserCenterRequest({ method: 'post', url: '/user/change-password', data: encryptedData })
}