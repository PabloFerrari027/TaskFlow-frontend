import { apiClient } from "@/lib/api/client";
import type {
  CreateProjectRequest,
  InviteToProjectRequest,
  Project,
  ProjectInvitation,
  ProjectInvitationPreview,
  ProjectMember,
  UpdateProjectRequest,
} from "@/types/project";

export const projectsService = {
  async listByWorkspace(workspaceId: string) {
    const { data } = await apiClient.get<Project[]>(
      `/workspaces/${workspaceId}/projects`
    );
    return data;
  },

  async get(projectId: string) {
    const { data } = await apiClient.get<Project>(`/projects/${projectId}`);
    return data;
  },

  async create(workspaceId: string, payload: CreateProjectRequest) {
    const { data } = await apiClient.post<Project>(
      `/workspaces/${workspaceId}/projects`,
      payload
    );
    return data;
  },

  async update(projectId: string, payload: UpdateProjectRequest) {
    const { data } = await apiClient.patch<Project>(
      `/projects/${projectId}`,
      payload
    );
    return data;
  },

  async archive(projectId: string) {
    const { data } = await apiClient.patch<Project>(
      `/projects/${projectId}/archive`
    );
    return data;
  },

  async inviteMember(projectId: string, payload: InviteToProjectRequest) {
    const { data } = await apiClient.post<ProjectInvitation>(
      `/projects/${projectId}/invitations`,
      payload
    );
    return data;
  },

  async listInvitations(projectId: string) {
    const { data } = await apiClient.get<ProjectInvitation[]>(
      `/projects/${projectId}/invitations`
    );
    return data;
  },

  async revokeInvitation(projectId: string, invitationId: string) {
    const { data } = await apiClient.delete<{ revoked: boolean }>(
      `/projects/${projectId}/invitations/${invitationId}`
    );
    return data;
  },

  async previewInvitation(token: string) {
    const { data } = await apiClient.get<ProjectInvitationPreview>(
      `/projects/invitations/${token}/preview`,
      { _skipAuth: true }
    );
    return data;
  },

  async acceptInvitation(token: string) {
    const { data } = await apiClient.post(`/projects/invitations/${token}/accept`);
    return data;
  },

  async listMembers(projectId: string) {
    const { data } = await apiClient.get<ProjectMember[]>(
      `/projects/${projectId}/members`
    );
    return data;
  },

  async removeMember(projectId: string, userId: string) {
    const { data } = await apiClient.delete<{ removed: boolean }>(
      `/projects/${projectId}/members/${userId}`
    );
    return data;
  },
};
