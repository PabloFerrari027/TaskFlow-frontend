import type { InvitationStatus } from "./common";

export type FolderStatus = "ACTIVE" | "ARCHIVED";

export type BlockedItemCompletion = "WARN" | "BLOCK";

export interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  // null for a root folder; otherwise the parent within the same workspace.
  parentId: string | null;
  status: FolderStatus;
  /** Finishing an item with unfinished blockers: WARN lets it (with a notice), BLOCK refuses. */
  blockedItemCompletion: BlockedItemCompletion;
  createdBy: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface MoveFolderRequest {
  // null promotes the folder to a workspace root.
  parentId: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  blockedItemCompletion?: BlockedItemCompletion;
}

export type FolderRole = "MEMBER" | "GUEST";

export interface FolderMember {
  userId: string;
  // Profile name (also used for `@` mentions); null for an account without one.
  name: string | null;
  role: FolderRole;
  createdAt: string;
}

export interface FolderInvitation {
  id: string;
  folderId: string;
  email: string;
  role: FolderRole;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface InviteToFolderRequest {
  email: string;
  role: FolderRole;
}

export interface FolderInvitationPreview {
  folderId: string;
  folderName: string;
  email: string;
  role: FolderRole;
  status: InvitationStatus;
  expiresAt: string;
}
