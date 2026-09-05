import type { WorkspaceRole } from "@/types/workspace";

/**
 * The API scopes admin-style actions (rename workspace, invite, manage
 * members/custom fields, archive projects) to workspace ADMIN/OWNER — project
 * membership only has MEMBER/GUEST, with no elevated role of its own, so
 * project-level management is gated by the caller's workspace role too.
 */
const MANAGER_ROLES: WorkspaceRole[] = ["OWNER", "ADMIN"];

export function canManageWorkspace(role: WorkspaceRole | null | undefined) {
  return Boolean(role && MANAGER_ROLES.includes(role));
}

export function canInviteWorkspaceMembers(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

export function canManageWorkspaceMembers(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

export function canManageProjectMembers(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

export function canManageCustomFields(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

export function canArchiveProject(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

export function isLastOwner(
  members: { userId: string; role: WorkspaceRole }[],
  userId: string
) {
  const owners = members.filter((member) => member.role === "OWNER");
  return owners.length === 1 && owners[0]?.userId === userId;
}
