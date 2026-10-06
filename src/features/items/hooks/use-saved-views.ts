"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { CreateSavedViewRequest, SavedView, UpdateSavedViewRequest } from "@/types/saved-view";

export const savedViewsService = {
  // The folder's shared views plus the caller's personal ones.
  async list(folderId: string) {
    const { data } = await apiClient.get<SavedView[]>(`/folders/${folderId}/views`);
    return data;
  },

  async create(folderId: string, payload: CreateSavedViewRequest) {
    const { data } = await apiClient.post<SavedView>(`/folders/${folderId}/views`, payload);
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

export function useSavedViewsQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.savedViews.all(folderId),
    queryFn: () => savedViewsService.list(folderId),
  });
}

export function useCreateSavedViewMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSavedViewRequest) => savedViewsService.create(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all(folderId) });
      toast.success("Visão salva.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateSavedViewMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, payload }: { viewId: string; payload: UpdateSavedViewRequest }) =>
      savedViewsService.update(viewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all(folderId) });
      toast.success("Visão atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteSavedViewMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => savedViewsService.remove(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all(folderId) });
      toast.success("Visão apagada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
