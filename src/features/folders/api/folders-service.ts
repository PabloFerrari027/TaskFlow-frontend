import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateFolderRequest,
  InviteToFolderRequest,
  MoveFolderRequest,
  Folder,
  FolderInvitation,
  FolderInvitationPreview,
  FolderMember,
  UpdateFolderRequest,
} from "@/types/folder";

export const foldersService = {
  async listByWorkspace(workspaceId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Folder>>(
      `/workspaces/${workspaceId}/folders`,
      { params }
    );
    return data;
  },

  async get(folderId: string) {
    const { data } = await apiClient.get<Folder>(`/folders/${folderId}`);
    return data;
  },

  async create(workspaceId: string, payload: CreateFolderRequest) {
    const { data } = await apiClient.post<Folder>(
      `/workspaces/${workspaceId}/folders`,
      payload
    );
    return data;
  },

  async update(folderId: string, payload: UpdateFolderRequest) {
    const { data } = await apiClient.patch<Folder>(
      `/folders/${folderId}`,
      payload
    );
    return data;
  },

  async move(folderId: string, payload: MoveFolderRequest) {
    const { data } = await apiClient.patch<Folder>(
      `/folders/${folderId}/move`,
      payload
    );
    return data;
  },

  async archive(folderId: string) {
    const { data } = await apiClient.patch<Folder>(
      `/folders/${folderId}/archive`
    );
    return data;
  },

  async inviteMember(folderId: string, payload: InviteToFolderRequest) {
    const { data } = await apiClient.post<FolderInvitation>(
      `/folders/${folderId}/invitations`,
      payload
    );
    return data;
  },

  async listInvitations(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<FolderInvitation>>(
      `/folders/${folderId}/invitations`,
      { params }
    );
    return data;
  },

  async revokeInvitation(folderId: string, invitationId: string) {
    const { data } = await apiClient.delete<{ revoked: boolean }>(
      `/folders/${folderId}/invitations/${invitationId}`
    );
    return data;
  },

  async previewInvitation(token: string) {
    const { data } = await apiClient.get<FolderInvitationPreview>(
      `/folders/invitations/${token}/preview`,
      { _skipAuth: true }
    );
    return data;
  },

  async acceptInvitation(token: string) {
    const { data } = await apiClient.post(`/folders/invitations/${token}/accept`);
    return data;
  },

  async listMembers(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<FolderMember>>(
      `/folders/${folderId}/members`,
      { params }
    );
    return data;
  },

  async removeMember(folderId: string, userId: string) {
    const { data } = await apiClient.delete<{ removed: boolean }>(
      `/folders/${folderId}/members/${userId}`
    );
    return data;
  },
};
