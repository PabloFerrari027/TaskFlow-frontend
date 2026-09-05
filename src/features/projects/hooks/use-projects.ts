"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsService } from "@/features/projects/api/projects-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type {
  CreateProjectRequest,
  InviteToProjectRequest,
  UpdateProjectRequest,
} from "@/types/project";

export function useProjectsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.projects.all(workspaceId ?? ""),
    queryFn: () => projectsService.listByWorkspace(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useProjectQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectsService.get(projectId),
  });
}

export function useCreateProjectMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectRequest) =>
      projectsService.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
      toast.success("Projeto criado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectRequest) =>
      projectsService.update(projectId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.projects.detail(projectId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(data.workspaceId) });
      toast.success("Projeto atualizado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useArchiveProjectMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectsService.archive(projectId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.projects.detail(projectId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(data.workspaceId) });
      toast.success("Projeto arquivado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useProjectMembersQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: () => projectsService.listMembers(projectId),
  });
}

export function useRemoveProjectMemberMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => projectsService.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      toast.success("Membro removido do projeto.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useInviteProjectMemberMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteToProjectRequest) =>
      projectsService.inviteMember(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.invitations(projectId) });
      toast.success("Convite enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useProjectInvitationsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.invitations(projectId),
    queryFn: () => projectsService.listInvitations(projectId),
  });
}

export function useRevokeProjectInvitationMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      projectsService.revokeInvitation(projectId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.invitations(projectId) });
      toast.success("Convite revogado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useProjectInvitationPreviewQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.projects.invitationPreview(token),
    queryFn: () => projectsService.previewInvitation(token),
    retry: false,
  });
}

export function useAcceptProjectInvitationMutation() {
  return useMutation({
    mutationFn: (token: string) => projectsService.acceptInvitation(token),
  });
}
