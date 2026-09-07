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

/**
 * Queues an operation for the next push. A second offline edit to the same
 * entity merges into the still-pending one instead of appending a new
 * operation — otherwise the second op would carry the same `baseVersion` as
 * the first, and applying both in sequence would falsely CONFLICT against
 * the version the first op itself just produced on the server.
 */
export function enqueueOperation(
  workspaceId: string,
  operation: NewOperation
): QueuedOperation {
  const existing = read();
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
