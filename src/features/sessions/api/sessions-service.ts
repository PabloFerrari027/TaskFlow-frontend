import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { Session } from "@/types/session";

export const sessionsService = {
  async list(params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Session>>(
      "/auth/sessions",
      { params }
    );
    return data;
  },

  async revoke(sessionId: string) {
    const { data } = await apiClient.delete<{ revoked: boolean }>(
      `/auth/sessions/${sessionId}`
    );
    return data;
  },

  async revokeAll() {
    const { data } = await apiClient.delete<{ revokedCount: number }>(
      "/auth/sessions"
    );
    return data;
  },
};
