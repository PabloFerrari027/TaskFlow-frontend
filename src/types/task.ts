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
  /** Se a task tem imagem de capa. */
  hasCover: boolean;
  /** Rota autenticada (binário) da capa — `null` sem capa. Não serve como `<img src>`, ver `useTaskCoverUrl`. */
  coverUrl: string | null;
  attachments: Attachment[];
  /** Participantes aditivos da task — não inclui assigneeId automaticamente (conceitos independentes, sem hierarquia). */
  participantIds: string[];
  /** Usuários mencionados na descrição (task ou subtask). */
  mentionedUserIds: string[];
}

export interface CreateTaskRequest {
  title: string;
  sectionId?: string;
  description?: string;
  assigneeId?: string;
  parentTaskId?: string;
  dueDate?: string;
  priority?: TaskPriority;
  mentionedUserIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
  sectionId?: string;
  position?: number;
  dueDate?: string;
  priority?: TaskPriority;
  /** Substitui o conjunto atual de menções; `[]` remove todas; omitido não altera. */
  mentionedUserIds?: string[];
}

export interface ChangeTaskStatusRequest {
  status: TaskStatus;
}

/** Um item de `PATCH /tasks/bulk`: o mesmo corpo de `PATCH /tasks/:taskId` mais o id. */
export interface BulkUpdateTaskItem extends UpdateTaskRequest {
  taskId: string;
}

/** O que sobra de uma task removida (`POST /tasks/bulk-delete`); a remoção leva as subtasks junto. */
export interface DeletedTask {
  id: string;
  projectId: string;
  sectionId: string;
  parentTaskId: string | null;
  deletedSubtaskIds: string[];
}

export interface BulkItemError {
  /** Código de domínio (mesmos de `ErrorCode`) ou `INTERNAL_ERROR`. */
  code: string;
  message: string;
}

export type BulkItemResult<T> =
  | { index: number; taskId?: string; status: "SUCCESS"; data: T }
  | { index: number; taskId?: string; status: "FAILED"; error: BulkItemError };

/**
 * Resposta das rotas em massa: sempre `200`, com sucesso parcial e sem rollback.
 * `results` vem na ordem enviada; no create, `index` é a única forma de casar o
 * resultado com o item (uma task que falhou não tem id).
 */
export interface BulkResult<T> {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkItemResult<T>[];
}
