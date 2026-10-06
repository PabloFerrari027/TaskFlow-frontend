"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { recurringItemsService } from "@/features/recurring-items/api/recurring-items-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type {
  CreateItemRecurrenceRequest,
  RecurrenceSchedule,
  UpdateItemRecurrenceRequest,
} from "@/types/recurrence";

// At most 50 per folder — one page covers them all.
export function useRecurringItemsQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.recurringItems.all(folderId),
    queryFn: () => recurringItemsService.list(folderId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
    // `nextRunAt` moves on its own as occurrences run.
    refetchInterval: 60_000,
  });
}

export function useRecurrencePreviewQuery(folderId: string, schedule: RecurrenceSchedule | null) {
  return useQuery({
    queryKey: queryKeys.recurringItems.preview(folderId, schedule),
    queryFn: () => recurringItemsService.preview(folderId, schedule!),
    enabled: !!schedule,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });
}

export function useCreateRecurringItemMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemRecurrenceRequest) => recurringItemsService.create(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all(folderId) });
      toast.success("Item repetido criado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRecurringItemMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recurrenceId, payload }: { recurrenceId: string; payload: UpdateItemRecurrenceRequest }) =>
      recurringItemsService.update(folderId, recurrenceId, payload),
    onSuccess: (_recurrence, { payload }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all(folderId) });
      if (payload.enabled !== undefined && Object.keys(payload).length === 1) {
        toast.success(payload.enabled ? "Repetição ligada." : "Repetição pausada.");
      } else {
        toast.success("Item repetido atualizada.");
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRecurringItemMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recurrenceId: string) => recurringItemsService.remove(folderId, recurrenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all(folderId) });
      toast.success("Repetição removida. Os itens que ela já criou continuam na pasta.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
