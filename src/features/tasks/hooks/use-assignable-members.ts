"use client";

import { useProjectQuery, useProjectMembersQuery } from "@/features/projects/hooks/use-projects";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";

/**
 * Anyone who can act on a task's project: workspace members (who have
 * implicit project access) plus anyone explicitly invited to the project
 * itself (e.g. GUEST-only project collaborators).
 */
export function useAssignableMembers(projectId: string) {
  const projectQuery = useProjectQuery(projectId);
  const workspaceQuery = useWorkspaceQuery(projectQuery.data?.workspaceId ?? null);
  const projectMembersQuery = useProjectMembersQuery(projectId);

  const userIds = new Set<string>();
  workspaceQuery.data?.members.forEach((m) => userIds.add(m.userId));
  projectMembersQuery.data?.forEach((m) => userIds.add(m.userId));

  return {
    userIds: Array.from(userIds),
    isLoading: workspaceQuery.isLoading || projectMembersQuery.isLoading,
  };
}
