"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksService } from "@/features/tasks/api/tasks-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type {
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@/types/task";

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

  return useMutation({
    mutationFn: (payload: UpdateTaskRequest) => tasksService.update(taskId, payload),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      // `sectionId` may have changed, moving the task between columns —
      // invalidate every column since we don't track the previous one here.
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success("Tarefa atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Used for the section select on the task detail view and for drag-and-drop
// on the board — the target section/position is only known at call time, so
// unlike `useUpdateTaskMutation` this isn't bound to one task via the hook args.
// `position` lets callers drop a task above/below a specific sibling instead
// of always appending to the end of the destination section's list.
export function useMoveTaskToSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      sectionId,
      position,
    }: {
      taskId: string;
      sectionId?: string;
      position?: number;
    }) => tasksService.update(taskId, { sectionId, position }),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success("Tarefa movida.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useChangeTaskStatusMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeTaskStatusRequest) =>
      tasksService.changeStatus(taskId, payload),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      if (task.parentTaskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.subtasks(task.parentTaskId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(task.id) });
      toast.success("Status atualizado.");
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
