export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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
  sectionId: string;
  position: number;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  createdBy: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  /** Participantes aditivos da task — não inclui assigneeId automaticamente (conceitos independentes, sem hierarquia). */
  participantIds: string[];
}

export interface CreateTaskRequest {
  title: string;
  sectionId?: string;
  description?: string;
  assigneeId?: string;
  parentTaskId?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
  sectionId?: string;
  position?: number;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface ChangeTaskStatusRequest {
  status: TaskStatus;
}
