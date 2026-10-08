export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
export interface ActivityTask {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  tags: string[];
}
export interface Activity {
  _id: string;
  taskId: string;
  action: "taskCreated" | "taskStatusChanged";
  previousStatus: TaskStatus | null;
  currentStatus: TaskStatus;
  timestamp: string;
  task?: ActivityTask;
}
export interface TaskHistoryItem {
  _id: string;
  action: "taskCreated" | "taskStatusChanged";
  previousStatus: TaskStatus | null;
  currentStatus: TaskStatus;
  timestamp: string;
}
export interface TaskHistoryResult {
  task: ActivityTask;
  history: TaskHistoryItem[];
}
export interface Stats { totalTasks: number; byStatus: Record<TaskStatus, number>; mostCommonTag: string | null; }
export interface TaskInput { title: string; description?: string; status: TaskStatus; tags: string[]; }
