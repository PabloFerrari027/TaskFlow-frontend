"use client";

import * as React from "react";
import { TASK_DRAG_MIME } from "@/lib/dnd";
import type { Task } from "@/types/task";

export type DropEdge = "above" | "below" | null;

interface DraggedTaskData {
  taskId: string;
  sectionId: string;
}

interface ReorderPayload {
  taskId: string;
  fromSectionId: string;
  targetPosition: number;
}

// Lets a task item act as a drop target for another task being dragged over
// it: the cursor's position within the item's own bounding box (top half vs.
// bottom half) decides whether the dragged task lands above or below it.
export function useTaskDropTarget(task: Task, onDrop: (payload: ReorderPayload) => void) {
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
    const raw = e.dataTransfer.getData(TASK_DRAG_MIME);
    if (!raw) return;
    const dragged = JSON.parse(raw) as DraggedTaskData;
    if (dragged.taskId === task.id) return;
    onDrop({
      taskId: dragged.taskId,
      fromSectionId: dragged.sectionId,
      targetPosition: edge === "below" ? task.position + 1 : task.position,
    });
  }

  return { dropEdge, handleDragOver, handleDragLeave, handleDrop };
}
