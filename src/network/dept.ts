import { SysRequest } from './request'

interface Dept {
  id?: number
  parentId?: number
  name: string
  sort?: number
  leader?: string
  phone?: string
  email?: string
  status?: boolean
  deleted?: boolean
  createTime?: string
}

interface PageVo {
  pageNum: number
  pageSize: number
}

export const createDept = (dept: Dept) => SysRequest({ 
  method: 'post', 
  url: '/dept/create', 
  data: dept 
})

export const getDeptById = (id: number) => SysRequest({ method: 'get', url: `/dept/get/${id}` })

export const getAllDepts = (pageVo: PageVo) => SysRequest({ 
  method: 'post', 
  url: '/dept/list', 
  data: pageVo 
})

export const getTreeDepts = () => SysRequest({ 
  method: 'get', 
  url: '/dept/tree'
})

export const updateDept = (dept: Dept) => SysRequest({ 
  method: 'post', 
  url: '/dept/update', 
  data: dept 
})

export const deleteDept = (id: number) => SysRequest({ method: 'delete', url: `/dept/delete/${id}` })
