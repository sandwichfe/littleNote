// src/network/user.ts
import { request } from './request'
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

export const createUser = (user: User) => request({ method: 'post', url: '/api/portal/sys/user/create', data: user })

export const getUserById = (id: number) => request({ method: 'get', url: `/api/portal/sys/user/get/${id}` })

export const getAllUsers = (pageVo: PageVo) => request({ method: 'post', url: '/api/portal/sys/user/list', data: pageVo })

export const updateUser = (user: User) => request({ method: 'post', url: '/api/portal/sys/user/update', data: user })

export const deleteUser = (id: number) => request({ method: 'delete', url: `/api/portal/sys/user/delete/${id}` })


export const getCurrentUser = () => request({ method: 'get', url: `/api/portal/userCenter/getCurrentUser` })

export const updateCurrentUser = (user: User) => request({ method: 'post', url: '/api/portal/userCenter/updateCurrentUser', data: user })

export const changePassword = (changePasswordData: ChangePasswordRequest) => {
  // 对密码进行RSA加密
  const encryptedData = {
    ...changePasswordData,
    oldPassword: cipherText(changePasswordData.oldPassword),
    newPassword: cipherText(changePasswordData.newPassword),
    confirmPassword: cipherText(changePasswordData.confirmPassword)
  }
  return request({ method: 'post', url: '/api/portal/userCenter/change-password', data: encryptedData })
}
