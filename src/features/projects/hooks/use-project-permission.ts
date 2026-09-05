"use client";

import { useProjectQuery } from "@/features/projects/hooks/use-projects";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageWorkspace } from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * Project membership only has MEMBER/GUEST (no elevated role), so
 * project-management actions are gated by the caller's role in the
 * project's parent workspace instead.
 */
export function useProjectPermission(projectId: string) {
  const { userId } = useAuth();
  const projectQuery = useProjectQuery(projectId);
  const workspaceQuery = useWorkspaceQuery(projectQuery.data?.workspaceId ?? null);

  const myRole = workspaceQuery.data?.members.find((m) => m.userId === userId)
    ?.role as WorkspaceRole | undefined;

  return {
    project: projectQuery.data,
    isLoading: projectQuery.isLoading || workspaceQuery.isLoading,
    canManage: canManageWorkspace(myRole),
  };
}
