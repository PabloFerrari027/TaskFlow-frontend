import { getDeviceId } from "@/features/sync/lib/device-id";
import type { QueuedOperation, SyncOperation } from "@/types/sync";

const STORAGE_KEY = "taskflow.syncOutbox";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): QueuedOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedOperation[]) : [];
  } catch {
    return [];
  }
}

function write(operations: QueuedOperation[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  } catch {
    // Storage unavailable (private mode, quota) — offline queueing degrades
    // to best-effort; the in-memory listeners still fire for this tab.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToOutbox(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getOutbox(): QueuedOperation[] {
  return read();
}

type NewOperation = Omit<SyncOperation, "operationId" | "clientTimestamp" | "deviceId"> & {
  meta?: QueuedOperation["meta"];
};

// The fields the server's CREATE path applies, per entity (`item-sync.handler.ts`
// on the backend). An offline edit to something created offline folds these
// into the pending CREATE; anything else (an ITEM's `status`) only goes through
// the UPDATE path, so it stays a separate op queued right after the CREATE.
// `position` is ignored by the server on both paths — it only rides along for
// the optimistic copy.
const CREATE_FIELDS: Partial<Record<SyncOperation["entityType"], ReadonlySet<string>>> = {
  ITEM: new Set([
    "folderId",
    "sectionId",
    "parentItemId",
    "title",
    "description",
    "assigneeId",
    "position",
  ]),
};

function findPendingCreate(
  operations: QueuedOperation[],
  workspaceId: string,
  operation: NewOperation
) {
  return operations.findIndex(
    (op) =>
      op.workspaceId === workspaceId &&
      op.entityType === operation.entityType &&
      op.entityId === operation.entityId &&
      op.operationType === "CREATE"
  );
}

// An entity created offline and deleted before it ever reached the server
// never needs to: every op queued for it goes, and so do the subitems created
// offline under it (their CREATE would fail on the missing parent).
function dropNeverSynced(operations: QueuedOperation[], workspaceId: string, entityId: string) {
  const dropped = new Set([entityId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const op of operations) {
      if (
        op.workspaceId === workspaceId &&
        op.operationType === "CREATE" &&
        !dropped.has(op.entityId) &&
        dropped.has(op.payload.parentItemId as string)
      ) {
        dropped.add(op.entityId);
        grew = true;
      }
    }
  }
  return operations.filter((op) => op.workspaceId !== workspaceId || !dropped.has(op.entityId));
}

/**
 * Queues an operation for the next push. A second offline edit to the same
 * entity merges into the still-pending one instead of appending a new
 * operation — otherwise the second op would carry the same `baseVersion` as
 * the first, and applying both in sequence would falsely CONFLICT against
 * the version the first op itself just produced on the server.
 *
 * Something created offline has no server version yet: an edit folds into
 * its pending CREATE (see `CREATE_FIELDS`), and a delete just takes the
 * CREATE back out — `null` then, since nothing is left to send.
 */
export function enqueueOperation(
  workspaceId: string,
  operation: NewOperation
): QueuedOperation | null {
  let existing = read();
  const createIndex =
    operation.operationType === "CREATE" ? -1 : findPendingCreate(existing, workspaceId, operation);

  if (createIndex >= 0 && operation.operationType === "DELETE") {
    write(dropNeverSynced(existing, workspaceId, operation.entityId));
    return null;
  }

  if (createIndex >= 0 && operation.operationType === "UPDATE") {
    const createFields = CREATE_FIELDS[operation.entityType];
    const intoCreate: Record<string, unknown> = {};
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(operation.payload)) {
      if (!createFields || createFields.has(key)) intoCreate[key] = value;
      else rest[key] = value;
    }
    const create = existing[createIndex];
    const merged: QueuedOperation = {
      ...create,
      payload: { ...create.payload, ...intoCreate },
      meta: { ...create.meta, ...operation.meta },
      clientTimestamp: new Date().toISOString(),
    };
    existing = [...existing];
    existing[createIndex] = merged;
    if (Object.keys(rest).length === 0) {
      write(existing);
      return merged;
    }
    // Nobody else can have touched it before its own CREATE lands, so the
    // follow-up UPDATE skips the version check (`baseVersion: null`). A later
    // edit merges into this UPDATE below and keeps that `null`.
    operation = { ...operation, payload: rest, baseVersion: null };
  }

  const mergeIndex =
    operation.operationType === "UPDATE"
      ? existing.findIndex(
          (op) =>
            op.workspaceId === workspaceId &&
            op.entityType === operation.entityType &&
            op.entityId === operation.entityId &&
            op.operationType === "UPDATE"
        )
      : -1;

  if (mergeIndex >= 0) {
    const merged: QueuedOperation = {
      ...existing[mergeIndex],
      payload: { ...existing[mergeIndex].payload, ...operation.payload },
      meta: { ...existing[mergeIndex].meta, ...operation.meta },
      clientTimestamp: new Date().toISOString(),
    };
    const next = [...existing];
    next[mergeIndex] = merged;
    write(next);
    return merged;
  }

  const queued: QueuedOperation = {
    ...operation,
    operationId: crypto.randomUUID(),
    clientTimestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    workspaceId,
  };
  write([...existing, queued]);
  return queued;
}

export function removeOperations(operationIds: string[]) {
  if (operationIds.length === 0) return;
  const idSet = new Set(operationIds);
  write(read().filter((op) => !idSet.has(op.operationId)));
}
