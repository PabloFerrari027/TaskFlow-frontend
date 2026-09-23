"use client";

import * as React from "react";
import { useProjectQuery, useProjectMembersQuery } from "@/features/projects/hooks/use-projects";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";

/**
 * Anyone who can act on a task's project: workspace members (who have
 * implicit project access) plus anyone explicitly invited to the project
 * itself (e.g. GUEST-only project collaborators).
 *
 * `names` maps userId → display name for whoever the API gave a name for
 * (member `name`), plus the signed-in user from GET /auth/me.
 */
export function useAssignableMembers(projectId: string) {
  const { userId: currentUserId } = useAuth();
  const { name: selfName } = useSelfIdentity();
  const projectQuery = useProjectQuery(projectId);
  const workspaceQuery = useWorkspaceQuery(projectQuery.data?.workspaceId ?? null);
  const projectMembersQuery = useProjectMembersQuery(projectId);

  const workspaceMembers = workspaceQuery.data?.members;
  const projectMembers = projectMembersQuery.data;

  const { userIds, names } = React.useMemo(() => {
    const ids = new Set<string>();
    const nameById = new Map<string, string>();
    for (const m of [...(workspaceMembers ?? []), ...(projectMembers ?? [])]) {
      ids.add(m.userId);
      const name = m.name?.trim();
      if (name) nameById.set(m.userId, name);
    }
    if (currentUserId && selfName) nameById.set(currentUserId, selfName);
    return { userIds: Array.from(ids), names: nameById };
  }, [workspaceMembers, projectMembers, currentUserId, selfName]);

  return {
    userIds,
    names,
    isLoading: workspaceQuery.isLoading || projectMembersQuery.isLoading,
  };
}
