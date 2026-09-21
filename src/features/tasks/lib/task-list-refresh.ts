import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

/**
 * Key shared by every mutation that adds, moves or removes a task in a list.
 * It only exists so `pendingTaskMutations` can tell when such a write is still
 * in flight — it is a different namespace from query keys.
 */
export const TASK_MUTATION_KEY = ["task-list-mutation"] as const;

// Long enough to merge a burst of quick creates/moves/deletes into one round of
// GETs, short enough that a single action still shows up right away.
const REFRESH_DEBOUNCE_MS = 250;

export function pendingTaskMutations(queryClient: QueryClient) {
  return queryClient.isMutating({ mutationKey: TASK_MUTATION_KEY });
}

/**
 * Restores an optimistic-update snapshot, unless other task mutations are in
 * flight. A snapshot only knows the world as it was when *its* mutation started,
 * so restoring it after a later one (say, a delete) would undo that one too —
 * the deleted task reappears. In that case the refresh after the last mutation
 * settles puts the lists back in line with the server instead.
 *
 * Call it from `onError`, where the failing mutation still counts as pending.
 */
export function shouldRestoreSnapshot(queryClient: QueryClient) {
  return pendingTaskMutations(queryClient) <= 1;
}

let refreshTimer: ReturnType<typeof setTimeout> | undefined;
const pendingSubtaskParents = new Set<string>();

/**
 * Refetches the task lists once the burst of task mutations is over, instead
 * of once per mutation.
 *
 * Every create/move/delete used to invalidate every column and the project
 * list on its own, so N quick operations meant N rounds of GETs — the rate
 * limit — and each of those GETs could land while a later write was still
 * unapplied on the server, painting a stale list (deleted tasks coming back)
 * until the next round. Here the refetch waits for the debounce window and is
 * skipped while any task mutation is still pending: that mutation schedules its
 * own refresh when it settles, so the final fetch always sees every write.
 */
export function scheduleTaskListsRefresh(
  queryClient: QueryClient,
  { subtaskParentIds = [] }: { subtaskParentIds?: Array<string | null | undefined> } = {}
) {
  for (const parentId of subtaskParentIds) {
    if (parentId) pendingSubtaskParents.add(parentId);
  }

  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = undefined;
    if (pendingTaskMutations(queryClient) > 0) return;

    const parents = [...pendingSubtaskParents];
    pendingSubtaskParents.clear();

    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProjectAll() });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
    for (const parentId of parents) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(parentId) });
    }
  }, REFRESH_DEBOUNCE_MS);
}
