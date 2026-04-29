export type ModuleKey = 'note' | 'todo' | 'manage'

export interface ModuleNavigationItem {
  key: ModuleKey
  label: string
  description: string
  route: string
}

export const moduleNavigationItems: ModuleNavigationItem[] = [
  {
    key: 'note',
    label: 'Note',
    description: '笔记空间',
    route: '/note'
  },
  {
    key: 'todo',
    label: 'Todo',
    description: '任务安排',
    route: '/todo'
  },
  {
    key: 'manage',
    label: 'Manager',
    description: '后台管理',
    route: '/manage/user'
  }
]

export const getActiveModuleKey = (path: string): ModuleKey => {
  if (path.startsWith('/manage')) {
    return 'manage'
  }

  if (path.startsWith('/todo')) {
    return 'todo'
  }

  return 'note'
}
