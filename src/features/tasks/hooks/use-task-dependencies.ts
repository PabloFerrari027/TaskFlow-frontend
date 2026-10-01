"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksService } from "@/features/tasks/api/tasks-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { TaskDependencies } from "@/types/task";

export function useTaskDependenciesQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.dependencies(taskId),
    queryFn: () => tasksService.listDependencies(taskId),
  });
}

function useOnDependenciesChanged() {
  const queryClient = useQueryClient();
  return (view: TaskDependencies, otherTaskId: string) => {
    queryClient.setQueryData(queryKeys.tasks.dependencies(view.taskId), view);
    // The other end of the link sees it from the other side.
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dependencies(otherTaskId) });
    queryClient.invalidateQueries({ queryKey: ["tasks", "timeline"] });
  };
}

export function useAddTaskDependencyMutation(taskId: string) {
  const onChanged = useOnDependenciesChanged();

  return useMutation({
    mutationFn: (blockerTaskId: string) => tasksService.addDependency(taskId, blockerTaskId),
    onSuccess: (view, blockerTaskId) => {
      onChanged(view, blockerTaskId);
      toast.success("Dependência adicionada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveTaskDependencyMutation(taskId: string) {
  const onChanged = useOnDependenciesChanged();

  return useMutation({
    mutationFn: (blockerTaskId: string) => tasksService.removeDependency(taskId, blockerTaskId),
    onSuccess: (view, blockerTaskId) => {
      onChanged(view, blockerTaskId);
      toast.success("Dependência removida.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useProjectTimelineQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.timeline(projectId),
    queryFn: () => tasksService.timeline(projectId),
  });
}
