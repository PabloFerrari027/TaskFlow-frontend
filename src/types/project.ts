import type { InvitationStatus } from "./common";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  // null for a root project; otherwise the parent within the same workspace.
  parentId: string | null;
  status: ProjectStatus;
  createdBy: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface MoveProjectRequest {
  // null promotes the project to a workspace root.
  parentId: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export type ProjectRole = "MEMBER" | "GUEST";

export interface ProjectMember {
  userId: string;
  // Display name, used for `@` mentions. Absent/null until the backend exposes it.
  name?: string | null;
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
