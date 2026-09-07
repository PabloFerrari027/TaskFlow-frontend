"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { workspacesService } from "@/features/workspaces/api/workspaces-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type {
  AddWorkspaceMemberRequest,
  ChangeWorkspaceMemberRoleRequest,
  CreateWorkspaceRequest,
  InviteToWorkspaceRequest,
  RenameWorkspaceRequest,
} from "@/types/workspace";

// A user's own workspace count is realistically small — fetch the max page
// size once (feeds the switcher/list everywhere) rather than paging it.
export function useWorkspacesQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces.all(),
    queryFn: () => workspacesService.list({ limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useWorkspaceQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(workspaceId ?? ""),
    queryFn: () => workspacesService.get(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkspaceRequest) => workspacesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
    },
  });
}

export function useRenameWorkspaceMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RenameWorkspaceRequest) =>
      workspacesService.rename(workspaceId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(workspaceId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
      toast.success("Workspace renomeado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteWorkspaceMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workspacesService.delete(workspaceId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
      toast.success("Workspace excluído.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAddWorkspaceMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddWorkspaceMemberRequest) =>
      workspacesService.addMember(workspaceId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(workspaceId), data);
      toast.success("Membro adicionado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useChangeMemberRoleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: ChangeWorkspaceMemberRoleRequest;
    }) => workspacesService.changeMemberRole(workspaceId, memberId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(workspaceId), data);
      toast.success("Papel do membro atualizado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      workspacesService.removeMember(workspaceId, memberId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(workspaceId), data);
      toast.success("Membro removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useInviteWorkspaceMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteToWorkspaceRequest) =>
      workspacesService.inviteMember(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
      toast.success("Convite enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useWorkspaceInvitationsQuery(workspaceId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.workspaces.invitations(workspaceId, page),
    queryFn: () => workspacesService.listInvitations(workspaceId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useRevokeWorkspaceInvitationMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      workspacesService.revokeInvitation(workspaceId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
      toast.success("Convite revogado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useWorkspaceInvitationPreviewQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.invitationPreview(token),
    queryFn: () => workspacesService.previewInvitation(token),
    retry: false,
  });
}

export function useAcceptWorkspaceInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => workspacesService.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
    },
  });
}
