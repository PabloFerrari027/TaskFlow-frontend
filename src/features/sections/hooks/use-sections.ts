"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sectionsService } from "@/features/sections/api/sections-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityDelete, queueEntityUpdate } from "@/features/sync/lib/sync-engine";
import type { CreateSectionRequest, Section, UpdateSectionRequest } from "@/types/section";

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

function findCachedSection(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  sectionId: string
) {
  const cached = queryClient.getQueryData<{ data: Section[] }>(
    queryKeys.sections.all(projectId)
  );
  return cached?.data.find((section) => section.id === sectionId);
}

export function useUpdateSectionMutation(projectId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: ({
      sectionId,
      payload,
    }: {
      sectionId: string;
      payload: UpdateSectionRequest;
    }) => {
      const current = findCachedSection(queryClient, projectId, sectionId);
      if (isOffline() && workspaceId && current) {
        queueEntityUpdate({
          workspaceId,
          entityType: "SECTION",
          entityId: sectionId,
          payload: payload as Record<string, unknown>,
          current,
          meta: { projectId },
        });
        return Promise.resolve();
      }
      return sectionsService.update(sectionId, payload).then(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Coluna atualizada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteSectionMutation(projectId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (sectionId: string) => {
      const current = findCachedSection(queryClient, projectId, sectionId);
      if (isOffline() && workspaceId && current) {
        queueEntityDelete({
          workspaceId,
          entityType: "SECTION",
          entityId: sectionId,
          baseVersion: current.version,
          meta: { projectId },
        });
        return Promise.resolve();
      }
      return sectionsService.remove(sectionId).then(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      toast.success(
        isOffline()
          ? "Exclusão salva offline — será sincronizada quando a conexão voltar."
          : "Coluna apagada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
