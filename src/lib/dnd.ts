import type { DragEvent } from "react";

// Distinct dataTransfer MIME types let a column tell apart a task being
// dropped into it from another column being dropped onto it, since both
// gestures land on the same element (the section column) and `dragover`
// only exposes `types` (not the payload) to decide how to react.
export const TASK_DRAG_MIME = "application/x-taskflow-task";
export const SECTION_DRAG_MIME = "application/x-taskflow-section";

// Native HTML5 drag-and-drop auto-generates a drag image at ~50% opacity
// whenever `setDragImage` is never called. To make the dragged card feel like
// it's actually being lifted off the list (full opacity, slight tilt + shadow)
// instead of a faded/plain copy, we apply that "lifted" look directly to the
// source element — the same node already on screen, guaranteed to be
// correctly painted — right before calling `setDragImage`, which makes the
// browser snapshot it as-is. An off-screen clone was tried first but browsers
// frequently snapshot elements positioned outside the viewport as blank, so
// the style is applied to the real element instead and reverted a frame later
// once the snapshot has already been taken.
export function setLiftedDragImage(event: DragEvent<HTMLElement>) {
  const source = event.currentTarget;
  const rect = source.getBoundingClientRect();

  const prevTransform = source.style.transform;
  const prevBoxShadow = source.style.boxShadow;
  const prevZIndex = source.style.zIndex;

  source.style.transform = "rotate(2deg) scale(1.03)";
  source.style.boxShadow = "0 12px 20px -6px rgb(0 0 0 / 0.25), 0 6px 8px -4px rgb(0 0 0 / 0.2)";
  source.style.zIndex = "50";

  event.dataTransfer.setDragImage(source, event.clientX - rect.left, event.clientY - rect.top);

  // Chromium captures the drag image snapshot asynchronously after dragstart
  // returns (not synchronously when `setDragImage` is called), so reverting
  // via `requestAnimationFrame` races it and can revert before the snapshot
  // is taken. `setTimeout` runs strictly later, after that capture is done.
  setTimeout(() => {
    source.style.transform = prevTransform;
    source.style.boxShadow = prevBoxShadow;
    source.style.zIndex = prevZIndex;
  }, 0);
}
