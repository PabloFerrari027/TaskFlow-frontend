import type { InvalidateQueryFilters, QueryClient } from "@tanstack/react-query";
import { pendingTaskMutations } from "@/features/tasks/lib/task-list-refresh";
import { queryKeys } from "@/lib/query-keys";

// A refetch already in flight is left alone instead of cancelled and restarted
// (the default). The change signals here often echo a write this client just
// made, whose own `onSuccess` invalidation is mid-refetch — restarting it would
// send the same request twice.
function invalidate(queryClient: QueryClient, filters: InvalidateQueryFilters) {
  return queryClient.invalidateQueries(filters, { cancelRefetch: false });
}

export interface EntityChange {
  // A plain string, not `SyncEntityType`: the realtime channel reports the
  // audit channel's entity types (which include `WORKSPACE` and
  // `CUSTOM_FIELD`), a superset/variant of what `/sync/push` accepts.
  entityType: string;
  entityId: string;
  workspaceId: string;
  // Optional narrowing hints — a push knows them from the queued operation's
  // `meta`; a realtime signal doesn't, and falls back to the broader prefix.
  projectId?: string;
  taskId?: string;
}

/**
 * The single `entityType → queryKeys` mapping, shared by the push/pull sync
 * flow (`sync-engine.ts`) and the realtime listener. It only ever
 * invalidates — the data itself always comes from a normal refetch.
 */
export function invalidateByEntityChange(
  queryClient: QueryClient,
  { entityType, entityId, workspaceId, projectId, taskId }: EntityChange
) {
  switch (entityType) {
    case "TASK":
      invalidate(queryClient, { queryKey: queryKeys.tasks.detail(entityId) });
      invalidate(queryClient, { queryKey: queryKeys.tasks.bySectionAll() });
      invalidate(queryClient, {
        queryKey: projectId
          ? queryKeys.tasks.all(projectId)
          : queryKeys.tasks.byProjectAll(),
      });
      return;
    case "PROJECT":
      invalidate(queryClient, { queryKey: queryKeys.projects.detail(entityId) });
      invalidate(queryClient, { queryKey: queryKeys.projects.all(workspaceId) });
      return;
    case "SECTION":
      invalidate(queryClient, { queryKey: queryKeys.tasks.bySectionAll() });
      invalidate(queryClient, {
        queryKey: projectId
          ? queryKeys.sections.all(projectId)
          : queryKeys.sections.byProjectAll(),
      });
      return;
    case "CUSTOM_FIELD":
    case "CUSTOM_FIELD_DEFINITION":
      invalidate(queryClient, {
        queryKey: projectId
          ? queryKeys.customFields.all(projectId)
          : queryKeys.customFields.byProjectAll(),
      });
      return;
    case "COMMENT":
      invalidate(queryClient, {
        queryKey: taskId ? queryKeys.comments.all(taskId) : queryKeys.comments.byTaskAll(),
      });
      return;
    case "WORKSPACE":
      invalidate(queryClient, { queryKey: queryKeys.workspaces.all() });
      return;
    default:
      // An entity type this client doesn't know about yet: don't guess a
      // narrow mapping, refresh everything workspace-scoped instead.
      invalidateWorkspaceData(queryClient, workspaceId);
  }
}

/** Activity feed and analytics are derived from every other entity, so any
 * change to one of them makes both stale. */
export function invalidateDerivedData(queryClient: QueryClient) {
  invalidate(queryClient, { queryKey: queryKeys.activity.root() });
  invalidate(queryClient, { queryKey: queryKeys.analytics.root() });
}

/** Coarse invalidation of every synced query group for a workspace — used
 * when a pull reports changes but their shape is opaque. */
export function invalidateWorkspaceData(queryClient: QueryClient, workspaceId: string) {
  // Task lists are left out while this client has task writes in flight: a
  // refetch now could resurrect a task that is being deleted. Those writes
  // refresh the lists themselves once they settle.
  const skipTasks = pendingTaskMutations(queryClient) > 0;

  invalidate(queryClient, { queryKey: queryKeys.projects.all(workspaceId) });
  if (!skipTasks) invalidate(queryClient, { queryKey: queryKeys.tasks.bySectionAll() });
  invalidate(queryClient, {
    predicate: (query) =>
      (["tasks", "custom-fields", "sections", "comments", "activity", "analytics"] as unknown[]).includes(
        query.queryKey[0]
      ) &&
      !(
        skipTasks &&
        query.queryKey[0] === "tasks" &&
        (query.queryKey[1] === "project" || query.queryKey[1] === "section")
      ),
  });
}
