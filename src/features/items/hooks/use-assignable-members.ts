"use client";

import * as React from "react";
import { useFolderQuery, useFolderMembersQuery } from "@/features/folders/hooks/use-folders";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";

/**
 * Anyone who can act on an item's folder: workspace members (who have
 * implicit folder access) plus anyone explicitly invited to the folder
 * itself (e.g. GUEST-only folder collaborators).
 *
 * `names` maps userId → display name for whoever the API gave a name for
 * (member `name`), plus the signed-in user from GET /auth/me.
 */
export function useAssignableMembers(folderId: string) {
  const { userId: currentUserId } = useAuth();
  const { name: selfName } = useSelfIdentity();
  const folderQuery = useFolderQuery(folderId);
  const workspaceQuery = useWorkspaceQuery(folderQuery.data?.workspaceId ?? null);
  const folderMembersQuery = useFolderMembersQuery(folderId);

  const workspaceMembers = workspaceQuery.data?.members;
  const folderMembers = folderMembersQuery.data;

  const { userIds, names } = React.useMemo(() => {
    const ids = new Set<string>();
    const nameById = new Map<string, string>();
    for (const m of [...(workspaceMembers ?? []), ...(folderMembers ?? [])]) {
      ids.add(m.userId);
      const name = m.name?.trim();
      if (name) nameById.set(m.userId, name);
    }
    if (currentUserId && selfName) nameById.set(currentUserId, selfName);
    return { userIds: Array.from(ids), names: nameById };
  }, [workspaceMembers, folderMembers, currentUserId, selfName]);

  return {
    userIds,
    names,
    isLoading: workspaceQuery.isLoading || folderMembersQuery.isLoading,
  };
}
