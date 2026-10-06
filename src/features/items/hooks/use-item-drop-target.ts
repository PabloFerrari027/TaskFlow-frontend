"use client";

import * as React from "react";
import { ITEM_DRAG_MIME } from "@/lib/dnd";
import type { Item } from "@/types/item";

export type DropEdge = "above" | "below" | null;

interface DraggedItemData {
  itemId: string;
  sectionId: string;
}

interface ReorderPayload {
  itemId: string;
  fromSectionId: string;
  targetPosition: number;
}

// Lets an item item act as a drop target for another item being dragged over
// it: the cursor's position within the item's own bounding box (top half vs.
// bottom half) decides whether the dragged item lands above or below it.
export function useItemDropTarget(item: Item, onDrop: (payload: ReorderPayload) => void) {
  const [dropEdge, setDropEdge] = React.useState<DropEdge>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    setDropEdge(e.clientY - rect.top < rect.height / 2 ? "above" : "below");
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
    const raw = e.dataTransfer.getData(ITEM_DRAG_MIME);
    if (!raw) return;
    const dragged = JSON.parse(raw) as DraggedItemData;
    if (dragged.itemId === item.id) return;
    onDrop({
      itemId: dragged.itemId,
      fromSectionId: dragged.sectionId,
      targetPosition: edge === "below" ? item.position + 1 : item.position,
    });
  }

  return { dropEdge, handleDragOver, handleDragLeave, handleDrop };
}
