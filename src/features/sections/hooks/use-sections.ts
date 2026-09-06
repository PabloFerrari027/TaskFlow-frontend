"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sectionsService } from "@/features/sections/api/sections-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type { CreateSectionRequest, UpdateSectionRequest } from "@/types/section";

// Sections are a project's columns — realistically few, fetch the max page
// size once and keep them ordered by position (the column display order).
export function useSectionsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.sections.all(projectId),
    queryFn: () => sectionsService.listByProject(projectId, { limit: MAX_PAGE_SIZE }),
    select: (result) => [...result.data].sort((a, b) => a.position - b.position),
  });
}

export function useCreateSectionMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSectionRequest) => sectionsService.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      toast.success("Coluna criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateSectionMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      payload,
    }: {
      sectionId: string;
      payload: UpdateSectionRequest;
    }) => sectionsService.update(sectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      toast.success("Coluna atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteSectionMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: string) => sectionsService.remove(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      toast.success("Coluna apagada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
