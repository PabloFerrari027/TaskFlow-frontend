"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksService } from "@/features/tasks/api/tasks-service";
import { scheduleTaskListsRefresh } from "@/features/tasks/lib/task-list-refresh";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type {
  CreateWorkflowStatusRequest,
  TaskStatus,
  UpdateWorkflowStatusRequest,
  WorkflowStatus,
} from "@/types/task";

export const STATUS_CATEGORIES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

// The server creates the default three on first read, so this is never empty.
export function useProjectStatusesQuery(projectId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.statuses.all(projectId ?? ""),
    queryFn: () => tasksService.listStatuses(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

/** Statuses of one category in board order — the first one is the category's default. */
export function statusesOfCategory(statuses: WorkflowStatus[], category: TaskStatus) {
  return statuses
    .filter((status) => status.category === category)
    .sort((a, b) => a.position - b.position);
}

/** The status a task is in: its own, or its category's default. */
export function resolveTaskStatus(
  statuses: WorkflowStatus[] | undefined,
  task: { status: TaskStatus; statusId: string | null }
) {
  if (!statuses) return undefined;
  return (
    statuses.find((status) => status.id === task.statusId) ??
    statuses.find((status) => status.category === task.status && status.isDefault) ??
    statusesOfCategory(statuses, task.status)[0]
  );
}

function onStatusesChanged(queryClient: QueryClient, projectId: string, statuses: WorkflowStatus[]) {
  queryClient.setQueryData(queryKeys.statuses.all(projectId), statuses);
}

export function useCreateWorkflowStatusMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkflowStatusRequest) =>
      tasksService.createStatus(projectId, payload),
    onSuccess: (statuses) => {
      onStatusesChanged(queryClient, projectId, statuses);
      toast.success("Etapa criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateWorkflowStatusMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ statusId, payload }: { statusId: string; payload: UpdateWorkflowStatusRequest }) =>
      tasksService.updateStatus(statusId, payload),
    onSuccess: (statuses) => onStatusesChanged(queryClient, projectId, statuses),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Reordering is a swap of two positions (the server never renumbers the others).
export function useSwapWorkflowStatusesMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ a, b }: { a: WorkflowStatus; b: WorkflowStatus }) => {
      // Equal positions (two statuses created with the same one) would make
      // the swap a no-op, so the second one is nudged past the first.
      const nextB = a.position === b.position ? a.position + 1 : a.position;
      await tasksService.updateStatus(a.id, { position: b.position });
      return tasksService.updateStatus(b.id, { position: nextB });
    },
    onSuccess: (statuses) => onStatusesChanged(queryClient, projectId, statuses),
    onError: (error) => {
      toast.error(getErrorMessage(error));
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all(projectId) });
    },
  });
}

export function useDeleteWorkflowStatusMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ statusId, replacementStatusId }: { statusId: string; replacementStatusId?: string }) =>
      tasksService.deleteStatus(statusId, replacementStatusId),
    onSuccess: ({ statuses, movedTasks }) => {
      onStatusesChanged(queryClient, projectId, statuses);
      // Tasks that were in it now point at the replacement.
      if (movedTasks > 0) scheduleTaskListsRefresh(queryClient);
      toast.success(
        movedTasks > 0
          ? `Etapa apagada. ${movedTasks === 1 ? "1 tarefa foi movida" : `${movedTasks} tarefas foram movidas`} para a etapa escolhida.`
          : "Etapa apagada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
