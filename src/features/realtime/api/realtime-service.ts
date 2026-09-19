import { apiClient } from "@/lib/api/client";
import type { RealtimeTicket } from "@/types/realtime";

export const realtimeService = {
  /** Short-lived, single-use ticket — the only credential that goes in the
   * stream URL (`EventSource` can't send an `Authorization` header). */
  async requestTicket(workspaceId: string) {
    const { data } = await apiClient.post<RealtimeTicket>(
      `/workspaces/${workspaceId}/realtime/ticket`
    );
    return data;
  },

  // The stream lives on the API origin, not the Next.js one, so a relative
  // URL would hit the wrong server.
  streamUrl(ticket: string) {
    return `${apiClient.defaults.baseURL}/realtime/stream?ticket=${encodeURIComponent(ticket)}`;
  },
};
