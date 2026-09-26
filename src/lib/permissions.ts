import type { DashboardPageVisibility } from "@/types/dashboard-page";
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

// Deleting a workspace requires OWNER specifically — ADMIN is not enough,
// unlike every other "manage" action above.
export function canDeleteWorkspace(role: WorkspaceRole | null | undefined) {
  return role === "OWNER";
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

// Same OWNER-only bar as deleting a workspace (API.md § 4) — deliberately
// more restrictive than the ADMIN-level actions above.
export function canManageAssistantSettings(role: WorkspaceRole | null | undefined) {
  return role === "OWNER";
}

// Every automation-rules endpoint is OWNER/ADMIN only (API.md § 21) — even
// listing — because a rule runs without anyone confirming it.
export function canManageAutomations(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

// Every API key / webhook endpoint is OWNER/ADMIN only (API.md § 22) — even
// listing — both grant long-lived access to the whole workspace.
export function canManageDeveloperPlatform(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

// Mirrors the "who edits" column of API.md § 25.1 for the page list, which
// has no `canEdit` of its own (the detail view does — prefer it there). A
// PRIVATE page is its creator's alone: OWNER/ADMIN get no exception. The
// seeded page (`createdBy: null`) has no creator, so only managers edit it.
export function canEditDashboardPage(
  page: { createdBy: string | null; visibility: DashboardPageVisibility },
  userId: string | null | undefined,
  role: WorkspaceRole | null | undefined
) {
  const isCreator = page.createdBy !== null && page.createdBy === userId;
  if (page.visibility === "PRIVATE") return isCreator;
  return isCreator || canManageWorkspace(role);
}

// Making a page PUBLIC (or minting its link) is OWNER/ADMIN only — even for
// the page's own creator (API.md § 25.1).
export function canPublishDashboardPage(role: WorkspaceRole | null | undefined) {
  return canManageWorkspace(role);
}

// Only an OWNER can grant OWNER to someone else — or demote an existing
// OWNER — even though ADMIN can otherwise manage members freely.
export function canGrantOwnerRole(currentUserRole: WorkspaceRole | null | undefined) {
  return currentUserRole === "OWNER";
}

export function isLastOwner(
  members: { userId: string; role: WorkspaceRole }[],
  userId: string
) {
  const owners = members.filter((member) => member.role === "OWNER");
  return owners.length === 1 && owners[0]?.userId === userId;
}
