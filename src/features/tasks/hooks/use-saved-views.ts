"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { CreateSavedViewRequest, SavedView, UpdateSavedViewRequest } from "@/types/saved-view";

export const savedViewsService = {
  // The project's shared views plus the caller's personal ones.
  async list(projectId: string) {
    const { data } = await apiClient.get<SavedView[]>(`/projects/${projectId}/views`);
    return data;
  },

  async create(projectId: string, payload: CreateSavedViewRequest) {
    const { data } = await apiClient.post<SavedView>(`/projects/${projectId}/views`, payload);
    return data;
  },

  async update(viewId: string, payload: UpdateSavedViewRequest) {
    const { data } = await apiClient.patch<SavedView>(`/views/${viewId}`, payload);
    return data;
  },

  async remove(viewId: string) {
    await apiClient.delete(`/views/${viewId}`);
  },
};

export function useSavedViewsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.savedViews.all(projectId),
    queryFn: () => savedViewsService.list(projectId),
  });
}

export function useCreateSavedViewMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSavedViewRequest) => savedViewsService.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all(projectId) });
      toast.success("Visão salva.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateSavedViewMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, payload }: { viewId: string; payload: UpdateSavedViewRequest }) =>
      savedViewsService.update(viewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all(projectId) });
      toast.success("Visão atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteSavedViewMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => savedViewsService.remove(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all(projectId) });
      toast.success("Visão apagada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
