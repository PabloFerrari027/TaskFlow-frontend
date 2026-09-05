import type { InvitationStatus } from "./common";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export type ProjectRole = "MEMBER" | "GUEST";

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  createdAt: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: ProjectRole;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface InviteToProjectRequest {
  email: string;
  role: ProjectRole;
}

export interface ProjectInvitationPreview {
  projectId: string;
  projectName: string;
  email: string;
  role: ProjectRole;
  status: InvitationStatus;
  expiresAt: string;
}
