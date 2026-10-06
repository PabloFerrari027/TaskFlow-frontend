"use client";

import * as React from "react";
import { ParentPickerDialog } from "@/components/shared/parent-picker-dialog";
import { useMoveFolderMutation } from "@/features/folders/hooks/use-folders";
import type { Folder } from "@/types/folder";

interface MoveFolderDialogProps {
  folder: Folder;
  // Every folder of the workspace (all statuses) — the destination list.
  folders: Folder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveFolderDialog({
  folder,
  folders,
  open,
  onOpenChange,
}: MoveFolderDialogProps) {
  const moveMutation = useMoveFolderMutation(folder.workspaceId);

  const items = React.useMemo(
    () =>
      folders.map((candidate) => ({
        id: candidate.id,
        parentId: candidate.parentId,
        name: candidate.name,
        // The API rejects archived parents (PARENT_FOLDER_ARCHIVED).
        disabledReason: candidate.status === "ARCHIVED" ? "Arquivada" : undefined,
      })),
    [folders]
  );

  return (
    <ParentPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Mover “${folder.name}”`}
      description="Escolha a pasta pai, ou o nível raiz para deixá-la sem pai."
      rootLabel="Nível raiz (sem pasta pai)"
      items={items}
      movingId={folder.id}
      currentParentId={folder.parentId}
      isPending={moveMutation.isPending}
      onConfirm={(parentId) =>
        moveMutation.mutate(
          { folderId: folder.id, parentId },
          { onSuccess: () => onOpenChange(false) }
        )
      }
    />
  );
}
