import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncService } from "@/features/sync/api/sync-service";
import { enqueueOperation, getOutbox, removeOperations } from "@/features/sync/lib/outbox";
import { getDeviceId } from "@/features/sync/lib/device-id";
import { getCursor, setCursor } from "@/features/sync/lib/cursor";
import { queryKeys } from "@/lib/query-keys";
import type { Project } from "@/types/project";
import type { Section } from "@/types/section";
import type {
  QueuedOperation,
  SyncEntityType,
  SyncOperation,
  SyncOperationResult,
} from "@/types/sync";
import type { Task } from "@/types/task";

export function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/**
 * Queues an offline UPDATE for an existing entity (task, project, section or
 * custom field definition — see `SyncStatusIndicator` for why comments and
 * task custom field values aren't queueable this way), and returns an
 * optimistic copy of `current` with `payload` applied so the calling
 * mutation's `onSuccess` can update the cache exactly as it would online.
 */
export function queueEntityUpdate<T extends { version: number }>({
  workspaceId,
  entityType,
  entityId,
  payload,
  current,
  meta,
}: {
  workspaceId: string;
  entityType: SyncEntityType;
  entityId: string;
  payload: Record<string, unknown>;
  current: T;
  meta?: QueuedOperation["meta"];
}): T {
  enqueueOperation(workspaceId, {
    entityType,
    entityId,
    operationType: "UPDATE",
    payload,
    baseVersion: current.version,
    meta,
  });
  return { ...current, ...payload };
}

/** Queues an offline DELETE for an entity that supports a real hard delete
 * through sync (only `SECTION` and `COMMENT` do — `PROJECT` and
 * `CUSTOM_FIELD_DEFINITION` always come back `REJECTED` for DELETE). */
export function queueEntityDelete({
  workspaceId,
  entityType,
  entityId,
  baseVersion,
  meta,
}: {
  workspaceId: string;
  entityType: SyncEntityType;
  entityId: string;
  baseVersion: number | null;
  meta?: QueuedOperation["meta"];
}) {
  enqueueOperation(workspaceId, {
    entityType,
    entityId,
    operationType: "DELETE",
    payload: {},
    baseVersion,
    meta,
  });
}

function toWireOperation(op: QueuedOperation): SyncOperation {
  return {
    operationId: op.operationId,
    entityType: op.entityType,
    entityId: op.entityId,
    operationType: op.operationType,
    payload: op.payload,
    baseVersion: op.baseVersion,
    clientTimestamp: op.clientTimestamp,
    deviceId: op.deviceId,
  };
}

function invalidateForEntity(queryClient: QueryClient, op: QueuedOperation) {
  const projectId = op.meta?.projectId;
  switch (op.entityType) {
    case "TASK":
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(op.entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId) });
      }
      return;
    case "PROJECT":
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(op.entityId) });
      return;
    case "SECTION":
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      }
      return;
    case "CUSTOM_FIELD_DEFINITION":
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      }
      return;
    case "COMMENT": {
      const taskId = op.meta?.taskId;
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.comments.all(taskId) });
      }
      return;
    }
  }
}

// Writes a push result's `serverEntityState` straight into the query cache
// so a synced offline edit shows up without waiting for a refetch.
function applyServerState(
  queryClient: QueryClient,
  op: QueuedOperation,
  state: Record<string, unknown>
) {
  switch (op.entityType) {
    case "TASK": {
      const task = state as unknown as Task;
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      return;
    }
    case "PROJECT": {
      const project = state as unknown as Project;
      queryClient.setQueryData(queryKeys.projects.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(project.workspaceId) });
      return;
    }
    case "SECTION": {
      const section = state as unknown as Section;
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(section.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      return;
    }
    case "CUSTOM_FIELD_DEFINITION": {
      const projectId = (state.projectId as string | undefined) ?? op.meta?.projectId;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      }
      return;
    }
    default:
      invalidateForEntity(queryClient, op);
  }
}

function applyResult(
  queryClient: QueryClient,
  op: QueuedOperation,
  result: SyncOperationResult
) {
  if (result.status === "REJECTED") {
    toast.error(
      `Uma alteração foi rejeitada pelo servidor${result.message ? `: ${result.message}` : "."}`
    );
    invalidateForEntity(queryClient, op);
    return;
  }

  if (result.status === "CONFLICT") {
    toast.warning(
      "Uma edição feita offline foi sobrescrita pela versão mais recente do servidor."
    );
  }

  if (result.serverEntityState) {
    applyServerState(queryClient, op, result.serverEntityState);
  } else {
    invalidateForEntity(queryClient, op);
  }
}

/**
 * Pushes a single operation right away instead of queueing it — used for the
 * one write the REST surface genuinely cannot express (clearing a task's
 * `assigneeId`; see `useUnassignTaskMutation`), which always has to go
 * through `/sync/push` even while online.
 */
export async function pushImmediate(
  queryClient: QueryClient,
  workspaceId: string,
  operation: Omit<SyncOperation, "operationId" | "clientTimestamp" | "deviceId">
): Promise<SyncOperationResult | undefined> {
  const op: QueuedOperation = {
    ...operation,
    operationId: crypto.randomUUID(),
    clientTimestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    workspaceId,
  };
  const { results } = await syncService.push({
    workspaceId,
    operations: [toWireOperation(op)],
  });
  const result = results[0];
  if (result) applyResult(queryClient, op, result);
  return result;
}

/** Pushes every queued operation, grouped by workspace, and reconciles the
 * cache with each result. Operations the server actually responded to
 * (APPLIED, CONFLICT, REJECTED, DUPLICATE) are removed from the outbox;
 * anything left un-acknowledged (the push itself failed — still offline, or
 * a server error) stays queued for the next attempt. */
export async function flushOutbox(queryClient: QueryClient) {
  const outbox = getOutbox();
  if (outbox.length === 0) return;

  const byWorkspace = new Map<string, QueuedOperation[]>();
  for (const op of outbox) {
    const group = byWorkspace.get(op.workspaceId) ?? [];
    group.push(op);
    byWorkspace.set(op.workspaceId, group);
  }

  for (const [workspaceId, ops] of byWorkspace) {
    try {
      const { results } = await syncService.push({
        workspaceId,
        operations: ops.map(toWireOperation),
      });

      const acknowledged: string[] = [];
      for (const result of results) {
        const op = ops.find((candidate) => candidate.operationId === result.operationId);
        if (!op) continue;
        acknowledged.push(result.operationId);
        applyResult(queryClient, op, result);
      }
      removeOperations(acknowledged);
    } catch {
      // Still unreachable (or a transient server error) — leave this
      // workspace's operations queued and retry on the next sync tick.
    }
  }
}

/** Pulls every page of changes since the last cursor for a workspace. The
 * exact shape of a change is left opaque by the API — rather than guess a
 * schema to merge by hand, any non-empty pull just invalidates this
 * workspace's synced query groups so they refetch from the REST endpoints,
 * which are the actual source of truth. */
export async function pullChanges(queryClient: QueryClient, workspaceId: string) {
  let cursor = getCursor(workspaceId);
  let hasMore = true;
  let sawChanges = false;

  while (hasMore) {
    const response = await syncService.pull(workspaceId, cursor);
    if (response.changes.length > 0) sawChanges = true;
    cursor = response.nextCursor;
    setCursor(workspaceId, cursor);
    hasMore = response.hasMore;
  }

  if (sawChanges) {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
    queryClient.invalidateQueries({
      predicate: (query) =>
        ["tasks", "custom-fields", "sections", "comments"].includes(
          query.queryKey[0] as string
        ),
    });
  }
}
