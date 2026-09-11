"use client";

import { useQuery } from "@tanstack/react-query";
import { getTaskActivity, getWorkspaceActivity } from "@/features/activity/api/activity-service";
import { queryKeys } from "@/lib/query-keys";

// Both feeds are genuinely unbounded (grows with every status/assignee/move
// edit, forever) — paged properly rather than fetched in full.
export function useWorkspaceActivityQuery(workspaceId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.activity.workspace(workspaceId, page),
    queryFn: () => getWorkspaceActivity(workspaceId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useTaskActivityQuery(taskId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.activity.task(taskId, page),
    queryFn: () => getTaskActivity(taskId, { page }),
    placeholderData: (previous) => previous,
  });
}
