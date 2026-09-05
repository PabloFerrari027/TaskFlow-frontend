import type { InvitationStatus } from "./common";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface RenameWorkspaceRequest {
  name: string;
}

export interface AddWorkspaceMemberRequest {
  userId: string;
  role: WorkspaceRole;
}

export interface ChangeWorkspaceMemberRoleRequest {
  role: WorkspaceRole;
}

export type WorkspaceInvitationRole = "ADMIN" | "MEMBER" | "GUEST";

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceInvitationRole;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface InviteToWorkspaceRequest {
  email: string;
  role: WorkspaceInvitationRole;
}

export interface WorkspaceInvitationPreview {
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceInvitationRole;
  status: InvitationStatus;
  expiresAt: string;
}
