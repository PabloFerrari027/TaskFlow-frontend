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
  /** The category the task is in — always set, even with a custom status. */
  status: TaskStatus;
  /** The project's custom status (`GET /projects/:id/statuses`); `null` = the category's default one. */
  statusId: string | null;
  /** The main assignee — always `assigneeIds[0]`, or `null` when nobody is. */
  assigneeId: string | null;
  /** Every assignee: the main one first, then the co-assignees. */
  assigneeIds: string[];
  dueDate: string | null;
  /** Planned start (timeline); never after `dueDate`. */
  startDate: string | null;
  /** A delivery/approval point on the timeline, not a span of work. */
  isMilestone: boolean;
  estimateMinutes: number | null;
  storyPoints: number | null;
  /** Only on `PATCH /tasks/:id/status`: notices about the transition (e.g. finished with open blockers). */
  warnings?: string[];
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
  /** Several assignees (max 20); the first is the main one. Wins over `assigneeId`. */
  assigneeIds?: string[];
  parentTaskId?: string;
  dueDate?: string;
  startDate?: string;
  isMilestone?: boolean;
  estimateMinutes?: number;
  storyPoints?: number;
  priority?: TaskPriority;
  mentionedUserIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  /** `null` unassigns; omitted leaves it as is. */
  assigneeId?: string | null;
  /** The COMPLETE set of assignees (`[]` removes all). Wins over `assigneeId`. */
  assigneeIds?: string[];
  sectionId?: string;
  position?: number;
  dueDate?: string;
  /** `null` clears it. */
  startDate?: string | null;
  isMilestone?: boolean;
  estimateMinutes?: number | null;
  storyPoints?: number | null;
  priority?: TaskPriority;
  /** Reparents: an id makes it a subtask of that task, `null` promotes it to the top level. */
  parentTaskId?: string | null;
  /** Substitui o conjunto atual de menções; `[]` remove todas; omitido não altera. */
  mentionedUserIds?: string[];
}

/** Send `status` (a category — goes to its default status) OR `statusId`. */
export type ChangeTaskStatusRequest = { status: TaskStatus; statusId?: never } | { statusId: string; status?: never };

/** A project's custom status ("Em revisão", "Aguardando cliente"…), always inside one category. */
export interface WorkflowStatus {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  /** Fixed once created. */
  category: TaskStatus;
  position: number;
  /** The first status of each category is where a task lands when only the category is chosen. */
  isDefault: boolean;
}

export interface CreateWorkflowStatusRequest {
  name: string;
  category: TaskStatus;
  color?: string;
  position?: number;
}

export interface UpdateWorkflowStatusRequest {
  name?: string;
  color?: string | null;
  position?: number;
}

export interface DeleteWorkflowStatusResponse {
  deletedId: string;
  movedTasks: number;
  statuses: WorkflowStatus[];
}

/** A task in the project's trash (`GET /projects/:id/trash`). */
export interface TrashedTask {
  id: string;
  projectId: string;
  sectionId: string;
  parentTaskId: string | null;
  title: string;
  deletedAt: string;
  /** When it is deleted for good. */
  purgeAt: string;
  /** Subtasks that went to the trash with it and come back on restore. */
  deletedSubtaskCount: number;
}

export interface RestoredTask {
  id: string;
  projectId: string;
  sectionId: string;
  parentTaskId: string | null;
  restoredSubtaskIds: string[];
}

export interface TaskDependencyLink {
  dependencyId: string;
  taskId: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
}

export interface TaskDependencies {
  taskId: string;
  /** Have to finish before this one. */
  blockedBy: TaskDependencyLink[];
  /** Wait for this one to finish. */
  blocking: TaskDependencyLink[];
  /** Blockers not finished yet. */
  openBlockerCount: number;
}

export interface TimelineTask {
  id: string;
  title: string;
  status: TaskStatus;
  sectionId: string;
  parentTaskId: string | null;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  isMilestone: boolean;
}

export interface TimelineEdge {
  id: string;
  blockerTaskId: string;
  blockedTaskId: string;
  type: "FINISH_TO_START";
}

export interface ProjectTimeline {
  projectId: string;
  tasks: TimelineTask[];
  dependencies: TimelineEdge[];
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
