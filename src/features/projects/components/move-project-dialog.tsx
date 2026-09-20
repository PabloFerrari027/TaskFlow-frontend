"use client";

import * as React from "react";
import { ParentPickerDialog } from "@/components/shared/parent-picker-dialog";
import { useMoveProjectMutation } from "@/features/projects/hooks/use-projects";
import type { Project } from "@/types/project";

interface MoveProjectDialogProps {
  project: Project;
  // Every project of the workspace (all statuses) — the destination list.
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveProjectDialog({
  project,
  projects,
  open,
  onOpenChange,
}: MoveProjectDialogProps) {
  const moveMutation = useMoveProjectMutation(project.workspaceId);

  const items = React.useMemo(
    () =>
      projects.map((candidate) => ({
        id: candidate.id,
        parentId: candidate.parentId,
        name: candidate.name,
        // The API rejects archived parents (PARENT_PROJECT_ARCHIVED).
        disabledReason: candidate.status === "ARCHIVED" ? "Arquivado" : undefined,
      })),
    [projects]
  );

  return (
    <ParentPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Mover “${project.name}”`}
      description="Escolha o projeto pai, ou o nível raiz para deixá-lo sem pai."
      rootLabel="Nível raiz (sem projeto pai)"
      items={items}
      movingId={project.id}
      currentParentId={project.parentId}
      isPending={moveMutation.isPending}
      onConfirm={(parentId) =>
        moveMutation.mutate(
          { projectId: project.id, parentId },
          { onSuccess: () => onOpenChange(false) }
        )
      }
    />
  );
}
