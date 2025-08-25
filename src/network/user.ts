// src/network/user.ts
import { LoginRequest } from './request'
import { cipherText } from '@/utils/aesUtil'

interface User {
  id?: number
  nickname: string
  username?: string
  password?: string
  mobile?: string
  email?: string
  avatarUrl?: string
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
}

export const createUser = (user: User) => LoginRequest({ method: 'post', url: '/api/sys/user/create', data: user })

export const getUserById = (id: number) => LoginRequest({ method: 'get', url: `/api/sys/user/get/${id}` })

export const getAllUsers = (pageVo: PageVo) => LoginRequest({ method: 'post', url: '/api/sys/user/list', data: pageVo })

export const updateUser = (user: User) => LoginRequest({ method: 'post', url: '/api/sys/user/update', data: user })

export const deleteUser = (id: number) => LoginRequest({ method: 'delete', url: `/api/sys/user/delete/${id}` })


export const getCurrentUser = () => LoginRequest({ method: 'get', url: `/api/user-center/user/getCurrentUser` })

export const updateCurrentUser = (user: User) => LoginRequest({ method: 'post', url: '/api/user-center/user/updateCurrentUser', data: user })

export const changePassword = (changePasswordData: ChangePasswordRequest) => {
  // 对密码进行RSA加密
  const encryptedData = {
    ...changePasswordData,
    oldPassword: cipherText(changePasswordData.oldPassword),
    newPassword: cipherText(changePasswordData.newPassword),
    confirmPassword: cipherText(changePasswordData.confirmPassword)
  }
  return LoginRequest({ method: 'post', url: '/api/user-center/user/change-password', data: encryptedData })
}