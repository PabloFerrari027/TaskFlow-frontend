"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksService } from "@/features/tasks/api/tasks-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type {
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@/types/task";

export function useTasksQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.all(projectId),
    queryFn: () => tasksService.listByProject(projectId),
  });
}

export function useTaskQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => tasksService.get(taskId),
  });
}

export function useSubtasksQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.subtasks(taskId),
    queryFn: () => tasksService.listSubtasks(taskId),
  });
}

export function useCreateTaskMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequest) => tasksService.create(projectId, payload),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId) });
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
      toast.success("Tarefa atualizada.");
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
