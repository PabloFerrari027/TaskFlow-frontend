import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type {
  AppNotification,
  ListNotificationsParams,
  NotificationPreference,
} from "@/types/notification";

export const notificationsService = {
  async list(params: ListNotificationsParams) {
    const { data } = await apiClient.get<PaginatedResult<AppNotification>>("/notifications", {
      params,
    });
    return data;
  },

  async unreadCount(workspaceId?: string) {
    const { data } = await apiClient.get<{ unread: number }>("/notifications/unread-count", {
      params: { workspaceId },
    });
    return data.unread;
  },

  async markRead(notificationId: string) {
    const { data } = await apiClient.patch<AppNotification>(
      `/notifications/${notificationId}/read`
    );
    return data;
  },

  async markAllRead(workspaceId?: string) {
    const { data } = await apiClient.post<{ updated: number }>("/notifications/read-all", null, {
      params: { workspaceId },
    });
    return data;
  },

  async getPreferences() {
    const { data } = await apiClient.get<{ preferences: NotificationPreference[] }>(
      "/notifications/preferences"
    );
    return data.preferences;
  },

  // Types left out of `preferences` stay as they are.
  async savePreferences(preferences: NotificationPreference[]) {
    const { data } = await apiClient.put<{ preferences: NotificationPreference[] }>(
      "/notifications/preferences",
      { preferences }
    );
    return data.preferences;
  },
};
