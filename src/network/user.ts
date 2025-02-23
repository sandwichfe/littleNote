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

export const createUser = (user: User) => LoginRequest({ method: 'post', url: '/sys/user', data: user })

export const getUserById = (id: number) => LoginRequest({ method: 'get', url: `/sys/user/${id}` })

export const getAllUsers = () => LoginRequest({ method: 'get', url: '/sys/user' })

export const updateUser = (user: User) => LoginRequest({ method: 'put', url: '/sys/user', data: user })

export const deleteUser = (id: number) => LoginRequest({ method: 'delete', url: `/sys/user/${id}` })