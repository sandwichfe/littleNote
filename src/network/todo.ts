import { LittleNoteRequest } from "./request";

// 定义Todo相关接口
export interface Task {
  id?: number;
  title: string;
  content?: string;
  type: 'work' | 'study' | 'health' | 'other';
  targetCount: number;
  completedCount: number;
  points: number;
  encouragement?: string;
  category: 'global' | 'daily';
  todoDate?: string;
  deadline?: string;
  createTime?: string;
  updateTime?: string;
  lastCompleteTime?: string;
  isDailyLimit?: number;
}

export interface Reward {
  id?: number;
  name: string;
  description?: string;
  points: number;
  status: 1 | 0;
  createTime?: string;
  updateTime?: string;
}

export interface UserReward {
  id?: number;
  rewardId: number;
  rewardName: string;
  pointsCost: number;
  status: 0 | 1;
  obtainedDate?: string;
  usedDate?: string;
  obtainTime?: string;
  useTime?: string;
}

// 获取任务列表
export function getTasks(params: any = {}): Promise<any> {
  const defaultParams = {
    pageNum: 1,
    pageSize: 100,
    category: 'global',
    ...params
  };
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/list',
    data: defaultParams
  });
}

// 获取每日任务列表
export function getDailyTasks(): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/list',
    data: {
      pageNum: 1,
      pageSize: 100,
      category: 'daily',
      todoDate: today
    }
  });
}

// 添加任务
export function addTask(task: Partial<Task>): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks',
    data: task
  });
}

// 更新任务
export function updateTask(id: number, task: Partial<Task>): Promise<any> {
  return LittleNoteRequest({
    method: 'put',
    url: `/todo/tasks/${id}`,
    data: task
  });
}

// 删除任务
export function deleteTask(id: number): Promise<any> {
  return LittleNoteRequest({
    method: 'delete',
    url: `/todo/tasks/${id}`
  });
}

// 完成任务一次
export function completeTask(id: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: `/todo/tasks/${id}/complete`
  });
}

// 复制任务到每日待办
export function copyToDaily(id: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: `/todo/tasks/${id}/copy-to-daily`
  });
}

// 获取用户积分
export function getUserPoints(): Promise<any> {
  return LittleNoteRequest({
    method: 'get',
    url: '/todo/points'
  });
}
