"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsService } from "@/features/notifications/api/notifications-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { NotificationPreference } from "@/types/notification";

// Realtime pushes a `notification` signal that invalidates these; the interval
// only covers a dropped connection.
const FALLBACK_REFRESH_MS = 2 * 60_000;

export function useUnreadNotificationsCountQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: FALLBACK_REFRESH_MS,
  });
}

export function useNotificationsQuery(
  { unreadOnly = false, page = 1 }: { unreadOnly?: boolean; page?: number },
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.notifications.list({ unreadOnly, page }),
    queryFn: () => notificationsService.list({ unreadOnly, page, limit: 20 }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() }),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationsService.getPreferences(),
  });
}

export function useSaveNotificationPreferenceMutation() {
  const queryClient = useQueryClient();
  const key = queryKeys.notifications.preferences();

  return useMutation({
    mutationFn: (preference: NotificationPreference) =>
      notificationsService.savePreferences([preference]),
    // Switches flip instantly; the server's answer (every type) replaces it.
    onMutate: async (preference) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationPreference[]>(key);
      queryClient.setQueryData<NotificationPreference[]>(key, (current) =>
        current?.map((p) => (p.type === preference.type ? preference : p))
      );
      return { previous };
    },
    onSuccess: (preferences) => queryClient.setQueryData(key, preferences),
    onError: (error, _preference, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(getErrorMessage(error));
    },
  });
}
