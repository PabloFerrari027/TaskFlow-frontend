import type { DragEvent } from "react";

// Distinct dataTransfer MIME types let a column tell apart a task being
// dropped into it from another column being dropped onto it, since both
// gestures land on the same element (the section column) and `dragover`
// only exposes `types` (not the payload) to decide how to react.
export const TASK_DRAG_MIME = "application/x-taskflow-task";
export const SECTION_DRAG_MIME = "application/x-taskflow-section";

// Native HTML5 drag-and-drop paints its drag image semi-transparent — browsers
// (Chromium in particular) fade it regardless of what is passed to
// `setDragImage`, and it can't be styled. To get a fully opaque item that
// floats above everything else until it's dropped, the native image is
// replaced by an invisible one and a real clone of the element is attached to
// `document.body` (fixed position, top z-index) and moved along with the
// cursor. The clone is removed as soon as the drag ends or the item is dropped.
//
// `target` is the element to lift; it defaults to the dragged element itself,
// but a drag handle (e.g. a column's grip) passes the whole column instead.
export function setLiftedDragImage(event: DragEvent<HTMLElement>, target?: HTMLElement | null) {
  const source = event.currentTarget;
  const lifted = target ?? source;
  const rect = lifted.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  const blank = document.createElement("div");
  blank.style.cssText = "position:fixed;top:-100px;left:-100px;width:1px;height:1px;opacity:0";
  document.body.appendChild(blank);
  event.dataTransfer.setDragImage(blank, 0, 0);
  // The browser snapshots the image after `dragstart` returns, so the
  // placeholder can only be removed once that has happened.
  setTimeout(() => blank.remove(), 0);

  const ghost = lifted.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("draggable");
  ghost.removeAttribute("id");
  ghost.style.cssText = [
    "position:fixed",
    `left:${event.clientX - offsetX}px`,
    `top:${event.clientY - offsetY}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    "margin:0",
    "opacity:1",
    "pointer-events:none",
    "z-index:2147483647",
    "transform:rotate(2deg) scale(1.03)",
    "transform-origin:center",
    "box-shadow:0 12px 20px -6px rgb(0 0 0 / 0.25), 0 6px 8px -4px rgb(0 0 0 / 0.2)",
    "transition:none",
  ].join(";");
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);

  // `dragover` (unlike `drag`) reports real coordinates in every browser and
  // bubbles from wherever the cursor is, so one document-level listener is
  // enough to keep the clone under the cursor.
  function move(e: globalThis.DragEvent) {
    ghost.style.left = `${e.clientX - offsetX}px`;
    ghost.style.top = `${e.clientY - offsetY}px`;
  }

  function cleanup() {
    ghost.remove();
    document.removeEventListener("dragover", move, true);
    document.removeEventListener("drop", cleanup, true);
    document.removeEventListener("dragend", cleanup, true);
    source.removeEventListener("dragend", cleanup);
  }

  document.addEventListener("dragover", move, true);
  // The source can unmount mid-drag (a dropped task moves to another column),
  // in which case its own `dragend` never fires — `drop` covers that path.
  document.addEventListener("drop", cleanup, true);
  document.addEventListener("dragend", cleanup, true);
  source.addEventListener("dragend", cleanup);
}
