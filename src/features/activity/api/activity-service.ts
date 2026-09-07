import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { ActivityLogEntry } from "@/types/activity";

export const activityService = {
  async listByWorkspace(workspaceId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<ActivityLogEntry>>(
      `/workspaces/${workspaceId}/activity`,
      { params }
    );
    return data;
  },

  async listByTask(taskId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<ActivityLogEntry>>(
      `/tasks/${taskId}/activity`,
      { params }
    );
    return data;
  },
};
