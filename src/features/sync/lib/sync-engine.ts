import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncService } from "@/features/sync/api/sync-service";
import { enqueueOperation, getOutbox, removeOperations } from "@/features/sync/lib/outbox";
import { getDeviceId } from "@/features/sync/lib/device-id";
import { getCursor, setCursor } from "@/features/sync/lib/cursor";
import {
  invalidateByEntityChange,
  invalidateWorkspaceData,
} from "@/features/sync/lib/invalidate-entity";
import { queryKeys } from "@/lib/query-keys";
import type { Folder } from "@/types/folder";
import type { Section } from "@/types/section";
import type {
  QueuedOperation,
  SyncEntityType,
  SyncOperation,
  SyncOperationResult,
} from "@/types/sync";
import type { DeletedItem, Item } from "@/types/item";

export function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/**
 * Spread into every mutation with an offline branch. React Query's default
 * `networkMode: "online"` pauses a mutation before its `mutationFn` once the
 * browser reports offline, so the `isOffline()` check inside never ran: the
 * write sat paused in memory (lost on reload) and, back online, went out over
 * REST instead of the outbox. `"always"` runs the `mutationFn` right away and
 * lets it pick the outbox.
 */
export const OFFLINE_CAPABLE_MUTATION = { networkMode: "always" } as const;

/**
 * Queues an offline CREATE under an id generated here, which the server keeps
 * (the sync handlers upsert by `entityId`). Edits and deletes made before it
 * syncs fold into this op — see `enqueueOperation`. Only `ITEM` is created
 * this way for now.
 */
export function queueEntityCreate({
  workspaceId,
  entityType,
  entityId,
  payload,
  meta,
}: {
  workspaceId: string;
  entityType: SyncEntityType;
  entityId: string;
  payload: Record<string, unknown>;
  meta?: QueuedOperation["meta"];
}) {
  enqueueOperation(workspaceId, {
    entityType,
    entityId,
    operationType: "CREATE",
    payload,
    baseVersion: null,
    meta,
  });
}

/**
 * Queues an offline UPDATE for an existing entity (item, folder, section or
 * custom field definition — see `SyncStatusIndicator` for why comments and
 * item custom field values aren't queueable this way), and returns an
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

/** Queues an offline DELETE for an entity that supports deletion through
 * sync: `SECTION` and `COMMENT` (hard delete) and `ITEM` (soft delete — only used
 * offline; online, items are deleted through `POST /items/bulk-delete`). `FOLDER` and
 * `CUSTOM_FIELD_DEFINITION` always come back `REJECTED` for DELETE. */
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
  invalidateByEntityChange(queryClient, {
    entityType: op.entityType,
    entityId: op.entityId,
    workspaceId: op.workspaceId,
    folderId: op.meta?.folderId,
    itemId: op.meta?.itemId,
  });
}

// Writes a push result's `serverEntityState` straight into the query cache
// so a synced offline edit shows up without waiting for a refetch.
function applyServerState(
  queryClient: QueryClient,
  op: QueuedOperation,
  state: Record<string, unknown>
) {
  switch (op.entityType) {
    case "ITEM": {
      // An applied DELETE answers with what's left of the item (the same
      // `DeletedItem` as `POST /items/bulk-delete`), not the item itself — the
      // cascade took every subitem along. A DELETE that hit a CONFLICT still
      // carries the full, surviving item and falls through below.
      if (op.operationType === "DELETE" && Array.isArray(state.deletedSubitemIds)) {
        const deleted = state as unknown as DeletedItem;
        for (const itemId of [deleted.id, ...deleted.deletedSubitemIds]) {
          queryClient.removeQueries({ queryKey: queryKeys.items.detail(itemId) });
        }
        invalidateByEntityChange(queryClient, {
          entityType: op.entityType,
          entityId: deleted.id,
          workspaceId: op.workspaceId,
          folderId: deleted.folderId,
        });
        if (deleted.parentItemId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.items.subitems(deleted.parentItemId),
          });
        }
        return;
      }
      const item = state as unknown as Item;
      queryClient.setQueryData(queryKeys.items.detail(item.id), item);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      // A subitem created offline sits in its parent's list as the optimistic copy.
      if (item.parentItemId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.subitems(item.parentItemId) });
      }
      return;
    }
    case "FOLDER": {
      const folder = state as unknown as Folder;
      queryClient.setQueryData(queryKeys.folders.detail(folder.id), folder);
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(folder.workspaceId) });
      return;
    }
    case "SECTION": {
      const section = state as unknown as Section;
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(section.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      return;
    }
    case "CUSTOM_FIELD_DEFINITION": {
      const folderId = (state.folderId as string | undefined) ?? op.meta?.folderId;
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(folderId) });
      }
      return;
    }
    default:
      invalidateForEntity(queryClient, op);
  }
}

const REJECTED_ENTITY_LABEL: Record<SyncEntityType, string> = {
  ITEM: "em um item",
  FOLDER: "em uma pasta",
  SECTION: "em uma coluna",
  CUSTOM_FIELD_DEFINITION: "em um campo personalizado",
  ITEM_CUSTOM_FIELD_VALUE: "em um campo personalizado",
  COMMENT: "em um comentário",
};

/**
 * A CREATE the server refused (a plan limit, a folder removed meanwhile) takes
 * along every op that leaned on it — a follow-up edit, a subitem created under
 * it — which the server refuses in turn. For the person that is one thing:
 * what they made offline is gone. So it's one toast for all of it, and the
 * optimistic copies leave the caches. `lostCreates` collects, per push, the
 * ids whose CREATE failed.
 */
function applyLostCreate(queryClient: QueryClient, op: QueuedOperation, lostCreates: Set<string>) {
  if (op.operationType === "CREATE") lostCreates.add(op.entityId);
  queryClient.removeQueries({ queryKey: queryKeys.items.detail(op.entityId) });
  invalidateForEntity(queryClient, op);
  const parentItemId = op.payload.parentItemId;
  if (typeof parentItemId === "string") {
    queryClient.invalidateQueries({ queryKey: queryKeys.items.subitems(parentItemId) });
  }
  toast.error("Um item criado sem conexão não pôde ser salvo e foi removido.", {
    id: "offline-create-rejected",
  });
}

function applyResult(
  queryClient: QueryClient,
  op: QueuedOperation,
  result: SyncOperationResult,
  lostCreates?: Set<string>
) {
  if (
    result.status === "REJECTED" &&
    lostCreates &&
    (op.operationType === "CREATE" ||
      lostCreates.has(op.entityId) ||
      lostCreates.has(op.payload.parentItemId as string))
  ) {
    if (result.message) console.warn(`Sync operation rejected: ${result.message}`);
    applyLostCreate(queryClient, op, lostCreates);
    return;
  }

  if (result.status === "REJECTED") {
    // The server's reason is English and carries no error code to translate:
    // keep it for debugging only and tell the user what they will see.
    if (result.message) console.warn(`Sync operation rejected: ${result.message}`);
    toast.error(
      `Uma alteração feita offline ${REJECTED_ENTITY_LABEL[op.entityType]} não pôde ser salva e foi desfeita.`
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
 * one write the REST surface genuinely cannot express (clearing an item's
 * `assigneeId`; see `useUnassignItemMutation`), which always has to go
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
      const lostCreates = new Set<string>();
      for (const result of results) {
        const op = ops.find((candidate) => candidate.operationId === result.operationId);
        if (!op) continue;
        acknowledged.push(result.operationId);
        applyResult(queryClient, op, result, lostCreates);
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
 * workspace's synced query groups (items, folders, sections, custom fields,
 * comments, activity, analytics) so they refetch from the REST endpoints,
 * which are the actual source of truth.
 *
 * `invalidate: false` only advances the cursor. The periodic poll uses it while
 * the realtime channel is open, since that channel already invalidates on every
 * change — and each pull otherwise re-reports this client's own writes, which
 * would refetch every active query again. */
export async function pullChanges(
  queryClient: QueryClient,
  workspaceId: string,
  { invalidate = true }: { invalidate?: boolean } = {}
) {
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

  if (sawChanges && invalidate) invalidateWorkspaceData(queryClient, workspaceId);
}
