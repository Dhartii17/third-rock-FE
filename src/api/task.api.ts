import { api } from "./client";
import type { Activity, Stats, Task, TaskHistoryResult, TaskInput, TaskStatus } from "../types";

export interface TaskListResult {
  data: Task[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export async function fetchTasks(params: Record<string, unknown> = {}) {
  const { data } = await api.get<TaskListResult>("/tasks", { params });
  return data;
}
export async function createTask(input: TaskInput) {
  const { data } = await api.post<{data: Task}>("/tasks", input); return data.data;
}
export async function updateTaskStatus(id: string, status: TaskStatus) {
  const { data } = await api.patch<{data: Task}>(`/tasks/${id}/status`, { status }); return data.data;
}
export interface ActivityListResult {
  data: Activity[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export async function fetchActivities(params: Record<string, unknown> = {}) {
  const { data } = await api.get<ActivityListResult>("/tasks/activities", { params });
  return data;
}
export async function fetchStats() {
  const { data } = await api.get<{data: Stats}>("/tasks/stats"); return data.data;
}

export async function fetchTaskHistory(id: string) {
  const { data } = await api.get<{data: TaskHistoryResult}>(`/tasks/${id}/history`);
  return data.data;
}
