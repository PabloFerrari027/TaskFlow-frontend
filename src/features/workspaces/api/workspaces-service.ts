import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  AddWorkspaceMemberRequest,
  ChangeWorkspaceMemberRoleRequest,
  CreateWorkspaceRequest,
  InviteToWorkspaceRequest,
  RenameWorkspaceRequest,
  Workspace,
  WorkspaceInvitation,
  WorkspaceInvitationPreview,
} from "@/types/workspace";

export const workspacesService = {
  async list(params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Workspace>>(
      "/workspaces",
      { params }
    );
    return data;
  },

  async get(workspaceId: string) {
    const { data } = await apiClient.get<Workspace>(`/workspaces/${workspaceId}`);
    return data;
  },

  async create(payload: CreateWorkspaceRequest) {
    const { data } = await apiClient.post<Workspace>("/workspaces", payload);
    return data;
  },

  async rename(workspaceId: string, payload: RenameWorkspaceRequest) {
    const { data } = await apiClient.patch<Workspace>(
      `/workspaces/${workspaceId}`,
      payload
    );
    return data;
  },

  async addMember(workspaceId: string, payload: AddWorkspaceMemberRequest) {
    const { data } = await apiClient.post<Workspace>(
      `/workspaces/${workspaceId}/members`,
      payload
    );
    return data;
  },

  async changeMemberRole(
    workspaceId: string,
    memberId: string,
    payload: ChangeWorkspaceMemberRoleRequest
  ) {
    const { data } = await apiClient.patch<Workspace>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      payload
    );
    return data;
  },

  async removeMember(workspaceId: string, memberId: string) {
    const { data } = await apiClient.delete<Workspace>(
      `/workspaces/${workspaceId}/members/${memberId}`
    );
    return data;
  },

  async inviteMember(workspaceId: string, payload: InviteToWorkspaceRequest) {
    const { data } = await apiClient.post<WorkspaceInvitation>(
      `/workspaces/${workspaceId}/invitations`,
      payload
    );
    return data;
  },

  async listInvitations(workspaceId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<WorkspaceInvitation>>(
      `/workspaces/${workspaceId}/invitations`,
      { params }
    );
    return data;
  },

  async revokeInvitation(workspaceId: string, invitationId: string) {
    const { data } = await apiClient.delete<{ revoked: boolean }>(
      `/workspaces/${workspaceId}/invitations/${invitationId}`
    );
    return data;
  },

  async previewInvitation(token: string) {
    const { data } = await apiClient.get<WorkspaceInvitationPreview>(
      `/workspaces/invitations/${token}/preview`,
      { _skipAuth: true }
    );
    return data;
  },

  async acceptInvitation(token: string) {
    const { data } = await apiClient.post<Workspace>(
      `/workspaces/invitations/${token}/accept`
    );
    return data;
  },
};
