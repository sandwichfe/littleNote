// src/network/user.ts
import { LoginRequest } from './request'

interface User {
  id?: number
  nickname: string
  username: string
  password?: string
  mobile?: string
  email: string
  avatarUrl?: string
  deleted?: boolean
  sourceFrom?: string
}

interface PageVo {
  pageNum: number
  pageSize: number
}

export const createUser = (user: User) => LoginRequest({ method: 'post', url: '/sys/user/create', data: user })

export const getUserById = (id: number) => LoginRequest({ method: 'get', url: `/sys/user/get/${id}` })

export const getAllUsers = (pageVo: PageVo) => LoginRequest({ method: 'post', url: '/sys/user/list', data: pageVo })

export const updateUser = (user: User) => LoginRequest({ method: 'post', url: '/sys/user/update', data: user })

export const deleteUser = (id: number) => LoginRequest({ method: 'delete', url: `/sys/user/delete/${id}` })


export const getCurrentUser = (id: number) => LoginRequest({ method: 'get', url: `/sys/user/current` })

export const updateCurrentUser = (user: User) => LoginRequest({ method: 'post', url: '/sys/user/update/current', data: user })