export type ItemStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type ItemPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface Item {
  id: string;
  folderId: string;
  sectionId: string;
  position: number;
  parentItemId: string | null;
  title: string;
  description: string | null;
  /** The category the item is in — always set, even with a custom status. */
  status: ItemStatus;
  /** The folder's custom status (`GET /folders/:id/statuses`); `null` = the category's default one. */
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
  /** Only on `PATCH /items/:id/status`: notices about the transition (e.g. finished with open blockers). */
  warnings?: string[];
  priority: ItemPriority | null;
  createdBy: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Se o item tem imagem de capa. */
  hasCover: boolean;
  /** Rota autenticada (binário) da capa — `null` sem capa. Não serve como `<img src>`, ver `useItemCoverUrl`. */
  coverUrl: string | null;
  attachments: Attachment[];
  /** Participantes aditivos do item — não inclui assigneeId automaticamente (conceitos independentes, sem hierarquia). */
  participantIds: string[];
  /** Usuários mencionados na descrição (item ou subitem). */
  mentionedUserIds: string[];
}

export interface CreateItemRequest {
  title: string;
  sectionId?: string;
  description?: string;
  assigneeId?: string;
  /** Several assignees (max 20); the first is the main one. Wins over `assigneeId`. */
  assigneeIds?: string[];
  parentItemId?: string;
  dueDate?: string;
  startDate?: string;
  isMilestone?: boolean;
  estimateMinutes?: number;
  storyPoints?: number;
  priority?: ItemPriority;
  mentionedUserIds?: string[];
}

export interface UpdateItemRequest {
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
  priority?: ItemPriority;
  /** Reparents: an id makes it a subitem of that item, `null` promotes it to the top level. */
  parentItemId?: string | null;
  /** Substitui o conjunto atual de menções; `[]` remove todas; omitido não altera. */
  mentionedUserIds?: string[];
}

/** Send `status` (a category — goes to its default status) OR `statusId`. */
export type ChangeItemStatusRequest = { status: ItemStatus; statusId?: never } | { statusId: string; status?: never };

/** A folder's custom status ("Em revisão", "Aguardando cliente"…), always inside one category. */
export interface WorkflowStatus {
  id: string;
  folderId: string;
  name: string;
  color: string | null;
  /** Fixed once created. */
  category: ItemStatus;
  position: number;
  /** The first status of each category is where an item lands when only the category is chosen. */
  isDefault: boolean;
}

export interface CreateWorkflowStatusRequest {
  name: string;
  category: ItemStatus;
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
  movedItems: number;
  statuses: WorkflowStatus[];
}

/** An item in the folder's trash (`GET /folders/:id/trash`). */
export interface TrashedItem {
  id: string;
  folderId: string;
  sectionId: string;
  parentItemId: string | null;
  title: string;
  deletedAt: string;
  /** When it is deleted for good. */
  purgeAt: string;
  /** Subitems that went to the trash with it and come back on restore. */
  deletedSubitemCount: number;
}

export interface RestoredItem {
  id: string;
  folderId: string;
  sectionId: string;
  parentItemId: string | null;
  restoredSubitemIds: string[];
}

export interface ItemDependencyLink {
  dependencyId: string;
  itemId: string;
  title: string;
  status: ItemStatus;
  dueDate: string | null;
}

export interface ItemDependencies {
  itemId: string;
  /** Have to finish before this one. */
  blockedBy: ItemDependencyLink[];
  /** Wait for this one to finish. */
  blocking: ItemDependencyLink[];
  /** Blockers not finished yet. */
  openBlockerCount: number;
}

export interface TimelineItem {
  id: string;
  title: string;
  status: ItemStatus;
  sectionId: string;
  parentItemId: string | null;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  isMilestone: boolean;
}

export interface TimelineEdge {
  id: string;
  blockerItemId: string;
  blockedItemId: string;
  type: "FINISH_TO_START";
}

export interface FolderTimeline {
  folderId: string;
  items: TimelineItem[];
  dependencies: TimelineEdge[];
}

/** Um item de `PATCH /items/bulk`: o mesmo corpo de `PATCH /items/:itemId` mais o id. */
export interface BulkUpdateItemEntry extends UpdateItemRequest {
  itemId: string;
}

/** O que sobra de um item removido (`POST /items/bulk-delete`); a remoção leva os subitems junto. */
export interface DeletedItem {
  id: string;
  folderId: string;
  sectionId: string;
  parentItemId: string | null;
  deletedSubitemIds: string[];
}

export interface BulkItemError {
  /** Código de domínio (mesmos de `ErrorCode`) ou `INTERNAL_ERROR`. */
  code: string;
  message: string;
}

export type BulkItemResult<T> =
  | { index: number; itemId?: string; status: "SUCCESS"; data: T }
  | { index: number; itemId?: string; status: "FAILED"; error: BulkItemError };

/**
 * Resposta das rotas em massa: sempre `200`, com sucesso parcial e sem rollback.
 * `results` vem na ordem enviada; no create, `index` é a única forma de casar o
 * resultado com o item (um item que falhou não tem id).
 */
export interface BulkResult<T> {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkItemResult<T>[];
}
