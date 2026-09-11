"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksService } from "@/features/tasks/api/tasks-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE, type PaginatedResult } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, pushImmediate, queueEntityUpdate } from "@/features/sync/lib/sync-engine";
import type {
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
} from "@/types/task";

function withCountAdjusted(result: PaginatedResult<Task>, delta: number): PaginatedResult<Task> {
  const total = Math.max(0, result.meta.total + delta);
  return {
    ...result,
    meta: {
      ...result.meta,
      total,
      totalPages: Math.max(1, Math.ceil(total / result.meta.limit)),
    },
  };
}

// Task lists can realistically grow large, so this is genuinely paged.
export function useTasksQuery(projectId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.tasks.all(projectId, page),
    queryFn: () => tasksService.listByProject(projectId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useTaskQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => tasksService.get(taskId),
  });
}

// Subtasks per task are realistically few — fetch the max page size once.
export function useSubtasksQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.subtasks(taskId),
    queryFn: () => tasksService.listSubtasks(taskId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

// One column of the task board. Each column pages independently.
export function useTasksBySectionQuery(sectionId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.tasks.bySection(sectionId, page),
    queryFn: () => tasksService.listBySection(sectionId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useCreateTaskMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequest) => tasksService.create(projectId, payload),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      if (task.parentTaskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.subtasks(task.parentTaskId),
        });
      }
      toast.success("Tarefa criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTaskMutation(taskId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (payload: UpdateTaskRequest) => {
      const current = queryClient.getQueryData<Task>(queryKeys.tasks.detail(taskId));
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: taskId,
            payload: payload as Record<string, unknown>,
            current,
            meta: { projectId: current.projectId },
          })
        );
      }
      return tasksService.update(taskId, payload);
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      // `sectionId` may have changed, moving the task between columns —
      // invalidate every column since we don't track the previous one here.
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Tarefa atualizada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * `PATCH /tasks/:taskId` can never send `assigneeId: null` — omitting the
 * field just leaves the current assignee untouched, and there is no REST
 * way to clear it (API.md § 9). Clearing an assignee is only possible
 * through `/sync/push`, so this always goes through the sync engine —
 * queued when offline, pushed immediately (still bypassing REST) when
 * online — instead of `tasksService.update`.
 */
export function useUnassignTaskMutation(taskId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: async () => {
      const current = queryClient.getQueryData<Task>(queryKeys.tasks.detail(taskId));
      if (!workspaceId || !current) {
        throw new Error("Não foi possível remover o responsável: dados da tarefa indisponíveis.");
      }

      if (isOffline()) {
        const task = queueEntityUpdate({
          workspaceId,
          entityType: "TASK",
          entityId: taskId,
          payload: { assigneeId: null },
          current,
          meta: { projectId: current.projectId },
        });
        queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
        return { projectId: task.projectId, queuedOffline: true, applied: true };
      }

      // `pushImmediate` already reconciles the cache (including the fresh
      // `version`) and toasts on REJECTED/CONFLICT — this only decides
      // whether the success toast below should fire.
      const result = await pushImmediate(queryClient, workspaceId, {
        entityType: "TASK",
        entityId: taskId,
        operationType: "UPDATE",
        payload: { assigneeId: null },
        baseVersion: current.version,
      });
      return {
        projectId: current.projectId,
        queuedOffline: false,
        applied: result?.status === "APPLIED",
      };
    },
    onSuccess: ({ projectId, queuedOffline, applied }) => {
      if (!applied) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success(
        queuedOffline
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Responsável removido."
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : getErrorMessage(error)),
  });
}

// Used for the section select on the task detail view and for drag-and-drop
// on the board — the target section/position is only known at call time, so
// unlike `useUpdateTaskMutation` this isn't bound to one task via the hook args.
// `position` lets callers drop a task above/below a specific sibling instead
// of always appending to the end of the destination section's list.
export function useMoveTaskToSectionMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: ({
      taskId,
      sectionId,
      position,
    }: {
      taskId: string;
      sectionId?: string;
      position?: number;
    }) => {
      const payload = { sectionId, position };
      const current = queryClient.getQueryData<Task>(queryKeys.tasks.detail(taskId));
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: taskId,
            payload,
            current,
            meta: { projectId: current.projectId },
          })
        );
      }
      return tasksService.update(taskId, payload);
    },
    // Each board column is its own paginated cache (tasks.bySection), so a
    // cross-column move needs to be reflected in both the source and
    // destination column's cache directly — invalidateQueries alone leaves
    // the task sitting in the old column (refetch is paused while offline,
    // per networkMode: "online") instead of appearing to move at all.
    // Same-column reordering is left alone: the task never disappears there,
    // it just settles into its exact position once the next pull reconciles.
    onMutate: async ({ taskId, sectionId: toSectionId }) => {
      if (!toSectionId) return {};

      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.bySectionAll() });

      const previousEntries: Array<{ queryKey: QueryKey; data: PaginatedResult<Task> }> = [];
      let movedTask: Task | undefined;

      for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Task>>({
        queryKey: queryKeys.tasks.bySectionAll(),
      })) {
        if (!data) continue;
        const found = data.data.find((t) => t.id === taskId);
        if (!found) continue;
        movedTask = found;
        previousEntries.push({ queryKey: key, data });
        queryClient.setQueryData<PaginatedResult<Task>>(
          key,
          withCountAdjusted({ ...data, data: data.data.filter((t) => t.id !== taskId) }, -1)
        );
      }

      if (movedTask) {
        for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Task>>({
          queryKey: queryKeys.tasks.bySection(toSectionId),
        })) {
          if (!data) continue;
          previousEntries.push({ queryKey: key, data });
          queryClient.setQueryData<PaginatedResult<Task>>(
            key,
            withCountAdjusted(
              { ...data, data: [...data.data, { ...movedTask, sectionId: toSectionId }] },
              1
            )
          );
        }
      }

      return { previousEntries };
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success(
        isOffline()
          ? "Movimentação salva offline — será sincronizada quando a conexão voltar."
          : "Tarefa movida."
      );
    },
    onError: (error, _vars, context) => {
      context?.previousEntries?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(getErrorMessage(error));
    },
  });
}

export function useChangeTaskStatusMutation(taskId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (payload: ChangeTaskStatusRequest) => {
      const current = queryClient.getQueryData<Task>(queryKeys.tasks.detail(taskId));
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: taskId,
            payload: payload as unknown as Record<string, unknown>,
            current,
            meta: { projectId: current.projectId },
          })
        );
      }
      return tasksService.changeStatus(taskId, payload);
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      if (task.parentTaskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.subtasks(task.parentTaskId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(task.id) });
      toast.success(
        isOffline()
          ? "Status salvo offline — será sincronizado quando a conexão voltar."
          : "Status atualizado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUploadAttachmentMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => tasksService.uploadAttachment(taskId, file),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      toast.success("Anexo enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDownloadAttachmentMutation(taskId: string) {
  return useMutation({
    mutationFn: async ({
      attachmentId,
      fileName,
    }: {
      attachmentId: string;
      fileName: string;
    }) => {
      const blob = await tasksService.downloadAttachment(taskId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
