import type { InvalidateQueryFilters, QueryClient } from "@tanstack/react-query";
import { pendingItemMutations } from "@/features/items/lib/item-list-refresh";
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
  folderId?: string;
  itemId?: string;
}

/**
 * The single `entityType → queryKeys` mapping, shared by the push/pull sync
 * flow (`sync-engine.ts`) and the realtime listener. It only ever
 * invalidates — the data itself always comes from a normal refetch.
 */
export function invalidateByEntityChange(
  queryClient: QueryClient,
  { entityType, entityId, workspaceId, folderId, itemId }: EntityChange
) {
  switch (entityType) {
    case "ITEM":
      invalidate(queryClient, { queryKey: queryKeys.items.detail(entityId) });
      invalidate(queryClient, { queryKey: queryKeys.items.bySectionAll() });
      invalidate(queryClient, {
        queryKey: folderId
          ? queryKeys.items.all(folderId)
          : queryKeys.items.byFolderAll(),
      });
      // Not narrowed by folderId: the item also counts in every ancestor's stats.
      invalidate(queryClient, { queryKey: queryKeys.folderStats.root() });
      invalidate(queryClient, { queryKey: queryKeys.home.root() });
      return;
    case "FOLDER":
      invalidate(queryClient, { queryKey: queryKeys.folders.detail(entityId) });
      invalidate(queryClient, { queryKey: queryKeys.folders.all(workspaceId) });
      // A moved sub-folder takes its items out of one subtree and into another.
      invalidate(queryClient, { queryKey: queryKeys.folderStats.root() });
      invalidate(queryClient, { queryKey: queryKeys.home.root() });
      return;
    case "SECTION":
      invalidate(queryClient, { queryKey: queryKeys.items.bySectionAll() });
      invalidate(queryClient, {
        queryKey: folderId
          ? queryKeys.sections.all(folderId)
          : queryKeys.sections.byFolderAll(),
      });
      return;
    case "CUSTOM_FIELD":
    case "CUSTOM_FIELD_DEFINITION":
      invalidate(queryClient, {
        queryKey: folderId
          ? queryKeys.customFields.all(folderId)
          : queryKeys.customFields.byFolderAll(),
      });
      return;
    case "COMMENT":
      invalidate(queryClient, {
        queryKey: itemId ? queryKeys.comments.all(itemId) : queryKeys.comments.byItemAll(),
      });
      return;
    case "ITEM_RECURRENCE":
      invalidate(queryClient, {
        queryKey: folderId ? queryKeys.recurringItems.all(folderId) : ["recurring-items"],
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

/** Activity feed, analytics (the folder stats tab included) and dashboard
 * pages (whose charts arrive already executed) are derived from every other
 * entity, so any change to one of them makes all of them stale. The server
 * still caches a page for up to 60s, so a refetched page can lag behind the
 * change that triggered it. */
export function invalidateDerivedData(queryClient: QueryClient) {
  invalidate(queryClient, { queryKey: queryKeys.activity.root() });
  invalidate(queryClient, { queryKey: queryKeys.analytics.root() });
  invalidate(queryClient, { queryKey: queryKeys.folderStats.root() });
  invalidate(queryClient, { queryKey: queryKeys.home.root() });
  invalidate(queryClient, { queryKey: queryKeys.dashboardPages.details() });
}

/** Coarse invalidation of every synced query group for a workspace — used
 * when a pull reports changes but their shape is opaque. */
export function invalidateWorkspaceData(queryClient: QueryClient, workspaceId: string) {
  // Item lists are left out while this client has item writes in flight: a
  // refetch now could resurrect an item that is being deleted. Those writes
  // refresh the lists themselves once they settle.
  const skipItems = pendingItemMutations(queryClient) > 0;

  invalidate(queryClient, { queryKey: queryKeys.folders.all(workspaceId) });
  invalidate(queryClient, { queryKey: queryKeys.dashboardPages.details() });
  if (!skipItems) invalidate(queryClient, { queryKey: queryKeys.items.bySectionAll() });
  invalidate(queryClient, {
    predicate: (query) =>
      (
        ["items", "custom-fields", "sections", "comments", "activity", "analytics", "folder-stats"] as unknown[]
      ).includes(
        query.queryKey[0]
      ) &&
      !(
        skipItems &&
        query.queryKey[0] === "items" &&
        (query.queryKey[1] === "folder" || query.queryKey[1] === "section")
      ),
  });
}
