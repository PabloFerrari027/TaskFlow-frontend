"use client";

import * as React from "react";
import { SECTION_DRAG_MIME } from "@/lib/dnd";
import type { Section } from "@/types/section";

export type SectionDropEdge = "left" | "right" | null;

interface DraggedSectionData {
  sectionId: string;
}

interface SectionReorderPayload {
  sectionId: string;
  targetPosition: number;
}

// Lets a section column act as a drop target for another column being
// dragged over it: the cursor's horizontal position within the column's own
// bounding box (left half vs. right half) decides whether the dragged
// column lands before or after it.
export function useSectionDropTarget(
  section: Section,
  onDrop: (payload: SectionReorderPayload) => void
) {
  const [dropEdge, setDropEdge] = React.useState<SectionDropEdge>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    setDropEdge(e.clientX - rect.left < rect.width / 2 ? "left" : "right");
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropEdge(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const edge = dropEdge;
    setDropEdge(null);
    const raw = e.dataTransfer.getData(SECTION_DRAG_MIME);
    if (!raw) return;
    const dragged = JSON.parse(raw) as DraggedSectionData;
    if (dragged.sectionId === section.id) return;
    onDrop({
      sectionId: dragged.sectionId,
      targetPosition: edge === "right" ? section.position + 1 : section.position,
    });
  }

  return { dropEdge, handleDragOver, handleDragLeave, handleDrop };
}
