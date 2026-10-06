"use client";

import { SectionSelect } from "@/features/items/components/section-select";
import { useMoveItemToSectionMutation } from "@/features/items/hooks/use-items";

export function ItemSectionSelect({
  folderId,
  itemId,
  sectionId,
}: {
  folderId: string;
  itemId: string;
  sectionId: string;
}) {
  const moveMutation = useMoveItemToSectionMutation();

  return (
    <SectionSelect
      folderId={folderId}
      value={sectionId}
      disabled={moveMutation.isPending}
      onChange={(next) => {
        if (next !== sectionId) {
          moveMutation.mutate({ itemId, sectionId: next });
        }
      }}
    />
  );
}
