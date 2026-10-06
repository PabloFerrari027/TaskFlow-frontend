import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

/**
 * Key shared by every mutation that adds, moves or removes an item in a list.
 * It only exists so `pendingItemMutations` can tell when such a write is still
 * in flight — it is a different namespace from query keys.
 */
export const ITEM_MUTATION_KEY = ["item-list-mutation"] as const;

// Long enough to merge a burst of quick creates/moves/deletes into one round of
// GETs, short enough that a single action still shows up right away.
const REFRESH_DEBOUNCE_MS = 250;

export function pendingItemMutations(queryClient: QueryClient) {
  return queryClient.isMutating({ mutationKey: ITEM_MUTATION_KEY });
}

/**
 * Restores an optimistic-update snapshot, unless other item mutations are in
 * flight. A snapshot only knows the world as it was when *its* mutation started,
 * so restoring it after a later one (say, a delete) would undo that one too —
 * the deleted item reappears. In that case the refresh after the last mutation
 * settles puts the lists back in line with the server instead.
 *
 * Call it from `onError`, where the failing mutation still counts as pending.
 */
export function shouldRestoreSnapshot(queryClient: QueryClient) {
  return pendingItemMutations(queryClient) <= 1;
}

let refreshTimer: ReturnType<typeof setTimeout> | undefined;
const pendingSubitemParents = new Set<string>();

/**
 * Refetches the item lists once the burst of item mutations is over, instead
 * of once per mutation.
 *
 * Every create/move/delete used to invalidate every column and the folder
 * list on its own, so N quick operations meant N rounds of GETs — the rate
 * limit — and each of those GETs could land while a later write was still
 * unapplied on the server, painting a stale list (deleted items coming back)
 * until the next round. Here the refetch waits for the debounce window and is
 * skipped while any item mutation is still pending: that mutation schedules its
 * own refresh when it settles, so the final fetch always sees every write.
 */
export function scheduleItemListsRefresh(
  queryClient: QueryClient,
  { subitemParentIds = [] }: { subitemParentIds?: Array<string | null | undefined> } = {}
) {
  for (const parentId of subitemParentIds) {
    if (parentId) pendingSubitemParents.add(parentId);
  }

  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = undefined;
    if (pendingItemMutations(queryClient) > 0) return;

    const parents = [...pendingSubitemParents];
    pendingSubitemParents.clear();

    queryClient.invalidateQueries({ queryKey: queryKeys.items.byFolderAll() });
    queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
    queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
    queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
    for (const parentId of parents) {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.subitems(parentId) });
    }
  }, REFRESH_DEBOUNCE_MS);
}
