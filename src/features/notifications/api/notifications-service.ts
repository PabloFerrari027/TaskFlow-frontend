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

// Calendar link (Google Agenda and phone calendars subscribe to it). The server returns the path
// only when the link is created; the full address uses the API URL.
export const calendarFeedService = {
  async status() {
    const { data } = await apiClient.get<{ enabled: boolean }>("/me/calendar-feed");
    return data.enabled;
  },

  // Creating again replaces the link (the old one stops working).
  async create() {
    const { data } = await apiClient.post<{ path: string }>("/me/calendar-feed");
    return new URL(data.path, apiClient.defaults.baseURL).toString();
  },

  async remove() {
    await apiClient.delete("/me/calendar-feed");
  },
};
