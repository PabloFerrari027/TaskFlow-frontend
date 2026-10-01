"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { recurringTasksService } from "@/features/recurring-tasks/api/recurring-tasks-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type {
  CreateTaskRecurrenceRequest,
  RecurrenceSchedule,
  UpdateTaskRecurrenceRequest,
} from "@/types/recurrence";

// At most 50 per project — one page covers them all.
export function useRecurringTasksQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.recurringTasks.all(projectId),
    queryFn: () => recurringTasksService.list(projectId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
    // `nextRunAt` moves on its own as occurrences run.
    refetchInterval: 60_000,
  });
}

export function useRecurrencePreviewQuery(projectId: string, schedule: RecurrenceSchedule | null) {
  return useQuery({
    queryKey: queryKeys.recurringTasks.preview(projectId, schedule),
    queryFn: () => recurringTasksService.preview(projectId, schedule!),
    enabled: !!schedule,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });
}

export function useCreateRecurringTaskMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRecurrenceRequest) => recurringTasksService.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringTasks.all(projectId) });
      toast.success("Tarefa repetida criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRecurringTaskMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recurrenceId, payload }: { recurrenceId: string; payload: UpdateTaskRecurrenceRequest }) =>
      recurringTasksService.update(projectId, recurrenceId, payload),
    onSuccess: (_recurrence, { payload }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringTasks.all(projectId) });
      if (payload.enabled !== undefined && Object.keys(payload).length === 1) {
        toast.success(payload.enabled ? "Repetição ligada." : "Repetição pausada.");
      } else {
        toast.success("Tarefa repetida atualizada.");
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRecurringTaskMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recurrenceId: string) => recurringTasksService.remove(projectId, recurrenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringTasks.all(projectId) });
      toast.success("Repetição removida. As tarefas que ela já criou continuam no projeto.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
