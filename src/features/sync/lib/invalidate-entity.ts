import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

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
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      queryClient.invalidateQueries({
        queryKey: projectId
          ? queryKeys.tasks.all(projectId)
          : queryKeys.tasks.byProjectAll(),
      });
      return;
    case "PROJECT":
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
      return;
    case "SECTION":
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      queryClient.invalidateQueries({
        queryKey: projectId
          ? queryKeys.sections.all(projectId)
          : queryKeys.sections.byProjectAll(),
      });
      return;
    case "CUSTOM_FIELD":
    case "CUSTOM_FIELD_DEFINITION":
      queryClient.invalidateQueries({
        queryKey: projectId
          ? queryKeys.customFields.all(projectId)
          : queryKeys.customFields.byProjectAll(),
      });
      return;
    case "COMMENT":
      queryClient.invalidateQueries({
        queryKey: taskId ? queryKeys.comments.all(taskId) : queryKeys.comments.byTaskAll(),
      });
      return;
    case "WORKSPACE":
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
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
  queryClient.invalidateQueries({ queryKey: queryKeys.activity.root() });
  queryClient.invalidateQueries({ queryKey: queryKeys.analytics.root() });
}

/** Coarse invalidation of every synced query group for a workspace — used
 * when a pull reports changes but their shape is opaque. */
export function invalidateWorkspaceData(queryClient: QueryClient, workspaceId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
  queryClient.invalidateQueries({
    predicate: (query) =>
      ["tasks", "custom-fields", "sections", "comments", "activity", "analytics"].includes(
        query.queryKey[0] as string
      ),
  });
}
