"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getProjectActivity,
  getTaskActivity,
  getWorkspaceActivity,
} from "@/features/activity/api/activity-service";
import { queryKeys } from "@/lib/query-keys";

// All feeds are genuinely unbounded (grows with every status/assignee/move
// edit, forever) — paged properly rather than fetched in full.
export function useWorkspaceActivityQuery(workspaceId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.activity.workspace(workspaceId, page),
    queryFn: () => getWorkspaceActivity(workspaceId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useProjectActivityQuery(projectId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.activity.project(projectId, page),
    queryFn: () => getProjectActivity(projectId, { page }),
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
