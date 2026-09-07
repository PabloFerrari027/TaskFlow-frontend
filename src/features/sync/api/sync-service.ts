import { apiClient } from "@/lib/api/client";
import type { PullSyncResponse, PushSyncRequest, PushSyncResponse } from "@/types/sync";

export const syncService = {
  async push(payload: PushSyncRequest) {
    const { data } = await apiClient.post<PushSyncResponse>("/sync/push", payload);
    return data;
  },

  async pull(workspaceId: string, since?: string, limit = 100) {
    const { data } = await apiClient.get<PullSyncResponse>("/sync/pull", {
      params: { workspaceId, since, limit },
    });
    return data;
  },
};
