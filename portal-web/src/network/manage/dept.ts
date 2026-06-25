import { request } from '../request'

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

export const createDept = (dept: Dept) => request({ 
  method: 'post', 
  url: '/api/portal/sys/dept/create', 
  data: dept 
})

export const getDeptById = (id: number) => request({ method: 'get', url: `/api/portal/sys/dept/get/${id}` })

export const getAllDepts = (pageVo: PageVo) => request({ 
  method: 'post', 
  url: '/api/portal/sys/dept/list', 
  data: pageVo 
})

export const getTreeDepts = () => request({ 
  method: 'get', 
  url: '/api/portal/sys/dept/tree'
})

export const updateDept = (dept: Dept) => request({ 
  method: 'post', 
  url: '/api/portal/sys/dept/update', 
  data: dept 
})

export const deleteDept = (id: number) => request({ method: 'delete', url: `/api/portal/sys/dept/delete/${id}` })
