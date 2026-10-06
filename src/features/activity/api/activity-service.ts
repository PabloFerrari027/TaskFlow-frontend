import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { ActivityLogEntry } from "@/types/activity";

export async function getWorkspaceActivity(workspaceId: string, params?: PaginationParams) {
  const { data } = await apiClient.get<PaginatedResult<ActivityLogEntry>>(
    `/workspaces/${workspaceId}/activity`,
    { params }
  );
  return data;
}

export async function getFolderActivity(folderId: string, params?: PaginationParams) {
  const { data } = await apiClient.get<PaginatedResult<ActivityLogEntry>>(
    `/folders/${folderId}/activity`,
    { params }
  );
  return data;
}

export async function getItemActivity(itemId: string, params?: PaginationParams) {
  const { data } = await apiClient.get<PaginatedResult<ActivityLogEntry>>(
    `/items/${itemId}/activity`,
    { params }
  );
  return data;
}
