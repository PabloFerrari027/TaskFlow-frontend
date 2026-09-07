export type SyncEntityType =
  | "PROJECT"
  | "TASK"
  | "SECTION"
  | "CUSTOM_FIELD_DEFINITION"
  | "TASK_CUSTOM_FIELD_VALUE"
  | "COMMENT";

export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";

// The wire shape of one operation, exactly as `POST /sync/push` expects it.
export interface SyncOperation {
  operationId: string;
  entityType: SyncEntityType;
  entityId: string;
  operationType: SyncOperationType;
  payload: Record<string, unknown>;
  baseVersion: number | null;
  clientTimestamp: string;
  deviceId: string;
}

export interface PushSyncRequest {
  workspaceId: string;
  operations: SyncOperation[];
}

export type SyncOperationStatus = "APPLIED" | "CONFLICT" | "REJECTED" | "DUPLICATE";

export interface SyncOperationResult {
  operationId: string;
  status: SyncOperationStatus;
  serverEntityState?: Record<string, unknown>;
  message?: string;
}

export interface PushSyncResponse {
  results: SyncOperationResult[];
}

// API.md never pins down a change's fields beyond "entidades alteradas" —
// callers should treat this as an opaque record and invalidate rather than
// parse it structurally.
export type SyncChange = Record<string, unknown>;

export interface PullSyncResponse {
  changes: SyncChange[];
  nextCursor: string;
  hasMore: boolean;
}

// A pending operation sitting in the local outbox. Extends the wire shape
// with client-only bookkeeping that's stripped before the operation is sent.
export interface QueuedOperation extends SyncOperation {
  workspaceId: string;
  // Cache-invalidation hints for when a push result carries no
  // `serverEntityState` to read them from (REJECTED, or a bare DUPLICATE).
  meta?: {
    projectId?: string;
    taskId?: string;
  };
}
