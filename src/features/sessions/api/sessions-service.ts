import { apiClient } from "@/lib/api/client";
import type { Session } from "@/types/session";

export const sessionsService = {
  async list() {
    const { data } = await apiClient.get<Session[]>("/auth/sessions");
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
