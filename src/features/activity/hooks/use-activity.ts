"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getFolderActivity,
  getItemActivity,
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

export function useFolderActivityQuery(folderId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.activity.folder(folderId, page),
    queryFn: () => getFolderActivity(folderId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useItemActivityQuery(itemId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.activity.item(itemId, page),
    queryFn: () => getItemActivity(itemId, { page }),
    placeholderData: (previous) => previous,
  });
}
