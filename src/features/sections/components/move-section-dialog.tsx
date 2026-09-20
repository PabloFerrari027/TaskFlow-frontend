"use client";

import { ParentPickerDialog } from "@/components/shared/parent-picker-dialog";
import { useMoveSectionMutation } from "@/features/sections/hooks/use-sections";
import type { Section } from "@/types/section";

interface MoveSectionDialogProps {
  projectId: string;
  section: Section;
  // Every section of the project — the destination list (same project only).
  sections: Section[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveSectionDialog({
  projectId,
  section,
  sections,
  open,
  onOpenChange,
}: MoveSectionDialogProps) {
  const moveMutation = useMoveSectionMutation(projectId);

  return (
    <ParentPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Mover “${section.name}”`}
      description="Escolha a coluna pai, ou o nível raiz para torná-la uma coluna do quadro."
      rootLabel="Nível raiz (coluna do quadro)"
      items={sections}
      movingId={section.id}
      currentParentId={section.parentId}
      isPending={moveMutation.isPending}
      onConfirm={(parentId) =>
        moveMutation.mutate(
          { sectionId: section.id, parentId },
          { onSuccess: () => onOpenChange(false) }
        )
      }
    />
  );
}
