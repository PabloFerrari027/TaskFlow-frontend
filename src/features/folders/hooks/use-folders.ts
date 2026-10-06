"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { foldersService } from "@/features/folders/api/folders-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityUpdate } from "@/features/sync/lib/sync-engine";
import type { PaginatedResult } from "@/types/common";
import type {
  CreateFolderRequest,
  InviteToFolderRequest,
  Folder,
  UpdateFolderRequest,
} from "@/types/folder";

// Offline updates only reach the server on the next sync pull, and
// invalidateQueries' refetch stays paused (networkMode: "online") until
// then — without this optimistic patch, an offline rename/archive wouldn't
// show up in the folders list until reconnect (the detail cache is already
// patched separately in each mutation's onSuccess).
async function patchCachedFolder(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | null,
  folderId: string,
  patch: Partial<Folder>
) {
  if (!workspaceId) return {};
  await queryClient.cancelQueries({ queryKey: queryKeys.folders.all(workspaceId) });
  const previous = queryClient.getQueryData<PaginatedResult<Folder>>(
    queryKeys.folders.all(workspaceId)
  );
  if (previous) {
    queryClient.setQueryData<PaginatedResult<Folder>>(queryKeys.folders.all(workspaceId), {
      ...previous,
      data: previous.data.map((folder) =>
        folder.id === folderId ? { ...folder, ...patch } : folder
      ),
    });
  }
  return { previous };
}

/**
 * The Active/Archived tabs on the folders page filter client-side, which
 * only works correctly against the full list — the API has no status
 * filter — so this fetches the max page size instead of paging. Returns
 * the full envelope (not just `.data`) so callers can warn if a workspace
 * ever exceeds that (`meta.totalPages > 1`).
 */
export function useFoldersQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.folders.all(workspaceId ?? ""),
    queryFn: () =>
      foldersService.listByWorkspace(workspaceId as string, { limit: MAX_PAGE_SIZE }),
    enabled: Boolean(workspaceId),
  });
}

export function useFolderQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.folders.detail(folderId),
    queryFn: () => foldersService.get(folderId),
    enabled: Boolean(folderId),
  });
}

export function useCreateFolderMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFolderRequest) =>
      foldersService.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
      toast.success("Pasta criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

interface UpdateFolderMutationOptions {
  /**
   * Inline edits in the folders table save cell by cell, so a success toast
   * and a full refetch per cell would be noise: `silent` skips the toast and
   * patches the folder in place in the cached list instead. Errors still toast.
   */
  silent?: boolean;
}

export function useUpdateFolderMutation(
  folderId: string,
  { silent = false }: UpdateFolderMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (payload: UpdateFolderRequest) => {
      // The detail cache is only filled once a folder is opened, but the
      // table edits straight from the list — fall back to its copy (its
      // version is what offline queueing needs).
      const current =
        queryClient.getQueryData<Folder>(queryKeys.folders.detail(folderId)) ??
        (workspaceId
          ? queryClient
              .getQueryData<PaginatedResult<Folder>>(queryKeys.folders.all(workspaceId))
              ?.data.find((folder) => folder.id === folderId)
          : undefined);
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "FOLDER",
            entityId: folderId,
            payload: payload as Record<string, unknown>,
            current,
          })
        );
      }
      return foldersService.update(folderId, payload);
    },
    onMutate: (payload) => patchCachedFolder(queryClient, workspaceId, folderId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.folders.detail(folderId), data);
      if (silent) {
        // The optimistic patch already shows the edit; swap in the server copy
        // (new version) and let inactive caches refetch on their next mount.
        queryClient.setQueryData<PaginatedResult<Folder>>(
          queryKeys.folders.all(data.workspaceId),
          (list) =>
            list
              ? { ...list, data: list.data.map((p) => (p.id === data.id ? data : p)) }
              : list
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.all(data.workspaceId),
          refetchType: "none",
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(data.workspaceId) });
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Pasta atualizada."
      );
    },
    onError: (error, _payload, context) => {
      if (workspaceId && context?.previous) {
        queryClient.setQueryData(queryKeys.folders.all(workspaceId), context.previous);
      }
      toast.error(getErrorMessage(error));
    },
  });
}

// Moving is online-only: the sync engine has no reparent operation, and the
// server is what validates scope/cycles, so there's nothing to queue offline.
export function useMoveFolderMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, parentId }: { folderId: string; parentId: string | null }) =>
      foldersService.move(folderId, { parentId }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.folders.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
      // Its items now roll up into a different parent.
      queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      toast.success("Pasta movida.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useArchiveFolderMutation(folderId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: () => {
      const current = queryClient.getQueryData<Folder>(queryKeys.folders.detail(folderId));
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "FOLDER",
            entityId: folderId,
            payload: { status: "ARCHIVED" },
            current,
          })
        );
      }
      return foldersService.archive(folderId);
    },
    onMutate: () =>
      patchCachedFolder(queryClient, workspaceId, folderId, { status: "ARCHIVED" }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.folders.detail(folderId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(data.workspaceId) });
      toast.success(
        isOffline()
          ? "Arquivamento salvo offline — será sincronizado quando a conexão voltar."
          : "Pasta arquivada."
      );
    },
    onError: (error, _vars, context) => {
      if (workspaceId && context?.previous) {
        queryClient.setQueryData(queryKeys.folders.all(workspaceId), context.previous);
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useFolderMembersQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.folders.members(folderId),
    queryFn: () => foldersService.listMembers(folderId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useRemoveFolderMemberMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => foldersService.removeMember(folderId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.members(folderId) });
      toast.success("Membro removido da pasta.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useInviteFolderMemberMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteToFolderRequest) =>
      foldersService.inviteMember(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.invitations(folderId) });
      toast.success("Convite enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useFolderInvitationsQuery(folderId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.folders.invitations(folderId, page),
    queryFn: () => foldersService.listInvitations(folderId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useRevokeFolderInvitationMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      foldersService.revokeInvitation(folderId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.invitations(folderId) });
      toast.success("Convite revogado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useFolderInvitationPreviewQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.folders.invitationPreview(token),
    queryFn: () => foldersService.previewInvitation(token),
    retry: false,
  });
}

export function useAcceptFolderInvitationMutation() {
  return useMutation({
    mutationFn: (token: string) => foldersService.acceptInvitation(token),
  });
}
