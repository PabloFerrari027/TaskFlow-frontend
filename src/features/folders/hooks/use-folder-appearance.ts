"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { foldersService } from "@/features/folders/api/folders-service";
import { isWorkspaceFolderDetail, setFolderDetail } from "@/features/folders/lib/folder-cache";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { FolderAppearanceKeys } from "@/types/folder-appearance";

// Online-only: the server validates keys and role, and sub-folders inherit.
export function useUpdateFolderAppearanceMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<FolderAppearanceKeys>) =>
      foldersService.updateAppearance(folderId, patch),
    onSuccess: (data) => {
      setFolderDetail(queryClient, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(data.workspaceId) });
      // Sub-folders inherit from this one, so their effective appearance changed.
      queryClient.invalidateQueries({
        predicate: (q) => isWorkspaceFolderDetail(q, data.workspaceId),
      });
      toast.success("Aparência salva");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
