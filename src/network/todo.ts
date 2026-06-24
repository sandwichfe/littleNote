import { request } from "./request";

export interface Task {
  id?: number;
  title: string;
  content?: string;
  type: 'work' | 'study' | 'health' | 'other';
  targetCount: number;
  completedCount: number;
  todoDate?: string;
  deadline?: string;
  createTime?: string;
  updateTime?: string;
  lastCompleteTime?: string;
  isDailyLimit?: number;
  status?: 0 | 1;
}

export interface TaskCompletionRecord {
  id: number;
  taskId: number;
  completedSequence: number;
  completedAt: string;
}

export interface TaskCounts {
  pendingCount: number;
  completedCount: number;
}

export function getTasks(params: any = {}): Promise<any> {
  const defaultParams = {
    pageNum: 1,
    pageSize: 100,
    category: 'global',
    ...params
  };
  return request({
    method: 'post',
    url: '/api/little-note/todo/tasks/list',
    data: defaultParams
  });
}

export function getTaskCounts(): Promise<any> {
  return request({
    method: 'get',
    url: '/api/little-note/todo/tasks/counts'
  });
}

export function addTask(task: Partial<Task>): Promise<any> {
  return request({
    method: 'post',
    url: '/api/little-note/todo/tasks',
    data: task
  });
}

export function updateTask(id: number, task: Partial<Task>): Promise<any> {
  return request({
    method: 'put',
    url: `/api/little-note/todo/tasks/${id}`,
    data: task
  });
}

export function deleteTask(id: number): Promise<any> {
  return request({
    method: 'delete',
    url: `/api/little-note/todo/tasks/${id}`
  });
}

export function completeTask(id: number): Promise<any> {
  return request({
    method: 'post',
    url: `/api/little-note/todo/tasks/${id}/complete`
  });
}

export function getTaskCompletionRecords(id: number): Promise<any> {
  return request({
    method: 'get',
    url: `/api/little-note/todo/tasks/${id}/completion-records`
  });
}

export function updateTaskCompletionRecord(taskId: number, recordId: number, completedAt: string): Promise<any> {
  return request({
    method: 'post',
    url: '/api/little-note/todo/tasks/completion-record/update',
    data: {
      taskId,
      id: recordId,
      completedAt
    }
  });
}

export function getDayView(date: string): Promise<any> {
  return request({
    method: 'post',
    url: '/api/little-note/todo/tasks/day-view',
    data: { date }
  });
}

export function getWeekView(year: number, week: number): Promise<any> {
  return request({
    method: 'post',
    url: '/api/little-note/todo/tasks/week-view',
    data: { year, week }
  });
}

export function getMonthView(year: number, month: number): Promise<any> {
  return request({
    method: 'post',
    url: '/api/little-note/todo/tasks/month-view',
    data: { year, month }
  });
}
