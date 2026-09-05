export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId?: string;
  parentTaskId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
}

export interface ChangeTaskStatusRequest {
  status: TaskStatus;
}
