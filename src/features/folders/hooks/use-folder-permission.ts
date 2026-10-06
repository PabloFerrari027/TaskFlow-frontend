"use client";

import { useFolderQuery } from "@/features/folders/hooks/use-folders";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageWorkspace } from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * Folder membership only has MEMBER/GUEST (no elevated role), so
 * folder-management actions are gated by the caller's role in the
 * folder's parent workspace instead.
 */
export function useFolderPermission(folderId: string) {
  const { userId } = useAuth();
  const folderQuery = useFolderQuery(folderId);
  const workspaceQuery = useWorkspaceQuery(folderQuery.data?.workspaceId ?? null);

  const myRole = workspaceQuery.data?.members.find((m) => m.userId === userId)
    ?.role as WorkspaceRole | undefined;

  return {
    folder: folderQuery.data,
    isLoading: folderQuery.isLoading || workspaceQuery.isLoading,
    canManage: canManageWorkspace(myRole),
  };
}
