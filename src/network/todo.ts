import { LittleNoteRequest } from "./request";

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
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/list',
    data: defaultParams
  });
}

export function getTaskCounts(): Promise<any> {
  return LittleNoteRequest({
    method: 'get',
    url: '/todo/tasks/counts'
  });
}

export function addTask(task: Partial<Task>): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks',
    data: task
  });
}

export function updateTask(id: number, task: Partial<Task>): Promise<any> {
  return LittleNoteRequest({
    method: 'put',
    url: `/todo/tasks/${id}`,
    data: task
  });
}

export function deleteTask(id: number): Promise<any> {
  return LittleNoteRequest({
    method: 'delete',
    url: `/todo/tasks/${id}`
  });
}

export function completeTask(id: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: `/todo/tasks/${id}/complete`
  });
}

export function getTaskCompletionRecords(id: number): Promise<any> {
  return LittleNoteRequest({
    method: 'get',
    url: `/todo/tasks/${id}/completion-records`
  });
}

export function getDayView(date: string): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/day-view',
    data: { date }
  });
}

export function getWeekView(year: number, week: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/week-view',
    data: { year, week }
  });
}

export function getMonthView(year: number, month: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/month-view',
    data: { year, month }
  });
}
