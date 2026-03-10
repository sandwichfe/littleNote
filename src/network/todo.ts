import { LittleNoteRequest } from "./request";

// 定义Todo相关接口
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
  status?: 0 | 1; // 0-未完成, 1-已完成
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

// 日视图 - 按日期查询任务时间线
export function getDayView(date: string): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/day-view',
    data: { date }
  });
}

// 周视图 - 按周查询任务统计
export function getWeekView(year: number, week: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/week-view',
    data: { year, week }
  });
}

// 月视图 - 按月查询任务日历
export function getMonthView(year: number, month: number): Promise<any> {
  return LittleNoteRequest({
    method: 'post',
    url: '/todo/tasks/month-view',
    data: { year, month }
  });
}
