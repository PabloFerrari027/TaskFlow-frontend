"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sectionsService } from "@/features/sections/api/sections-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityDelete, queueEntityUpdate } from "@/features/sync/lib/sync-engine";
import type { PaginatedResult } from "@/types/common";
import type { CreateSectionRequest, Section, UpdateSectionRequest } from "@/types/section";

// Sections are a folder's columns — realistically few, fetch the max page
// size once and keep them ordered by position (the column display order).
export function useSectionsQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.sections.all(folderId),
    queryFn: () => sectionsService.listByFolder(folderId, { limit: MAX_PAGE_SIZE }),
    select: (result) => [...result.data].sort((a, b) => a.position - b.position),
  });
}

export function useCreateSectionMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSectionRequest) => sectionsService.create(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(folderId) });
      toast.success("Coluna criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

function findCachedSection(
  queryClient: ReturnType<typeof useQueryClient>,
  folderId: string,
  sectionId: string
) {
  const cached = queryClient.getQueryData<{ data: Section[] }>(
    queryKeys.sections.all(folderId)
  );
  return cached?.data.find((section) => section.id === sectionId);
}

export function useUpdateSectionMutation(folderId: string) {
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
      const current = findCachedSection(queryClient, folderId, sectionId);
      if (isOffline() && workspaceId && current) {
        queueEntityUpdate({
          workspaceId,
          entityType: "SECTION",
          entityId: sectionId,
          payload: payload as Record<string, unknown>,
          current,
          meta: { folderId },
        });
        return Promise.resolve();
      }
      return sectionsService.update(sectionId, payload).then(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(folderId) });
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Coluna atualizada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Online-only, same reasoning as `useMoveFolderMutation`. A reparent also
// changes which column each item list renders under, so item lists refresh too.
export function useMoveSectionMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, parentId }: { sectionId: string; parentId: string | null }) =>
      sectionsService.move(sectionId, { parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      toast.success("Coluna movida.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteSectionMutation(folderId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (sectionId: string) => {
      const current = findCachedSection(queryClient, folderId, sectionId);
      if (isOffline() && workspaceId && current) {
        queueEntityDelete({
          workspaceId,
          entityType: "SECTION",
          entityId: sectionId,
          baseVersion: current.version,
          meta: { folderId },
        });
        return Promise.resolve();
      }
      return sectionsService.remove(sectionId).then(() => undefined);
    },
    // Offline deletes only reach the server on the next sync pull, and
    // invalidateQueries' refetch stays paused (networkMode: "online") until
    // then — without this optimistic removal, a section deleted offline
    // would stay visible until reconnect instead of disappearing right away
    // (same fix as useDeleteCommentMutation).
    onMutate: async (sectionId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.all(folderId) });
      const previous = queryClient.getQueryData<PaginatedResult<Section>>(
        queryKeys.sections.all(folderId)
      );
      if (previous) {
        queryClient.setQueryData<PaginatedResult<Section>>(queryKeys.sections.all(folderId), {
          ...previous,
          data: previous.data.filter((section) => section.id !== sectionId),
        });
      }
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(folderId) });
      toast.success(
        isOffline()
          ? "Exclusão salva offline — será sincronizada quando a conexão voltar."
          : "Coluna apagada."
      );
    },
    onError: (error, _sectionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.sections.all(folderId), context.previous);
      }
      toast.error(getErrorMessage(error));
    },
  });
}
