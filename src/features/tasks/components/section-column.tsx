"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Pager } from "@/components/shared/pager";
import { useMoveTaskToSectionMutation, useTasksBySectionQuery } from "@/features/tasks/hooks/use-tasks";
import { useDeleteSectionMutation, useUpdateSectionMutation } from "@/features/sections/hooks/use-sections";
import { useSectionDropTarget } from "@/features/sections/hooks/use-section-drop-target";
import { useSectionColumnWidth } from "@/features/tasks/hooks/use-section-column-width";
import { SectionFormDialog } from "@/features/sections/components/section-form-dialog";
import { TaskLineItem } from "@/features/tasks/components/task-line-item";
import { TaskCardItem } from "@/features/tasks/components/task-card-item";
import type { TaskViewMode } from "@/features/tasks/hooks/use-task-view-mode";
import { setLiftedDragImage, TASK_DRAG_MIME, SECTION_DRAG_MIME } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { Section } from "@/types/section";

// Must stay >= the auto-layout minimums below (`min-w-72`/`min-w-80`) — a
// manually resized column skips those Tailwind classes entirely (see the
// className logic below), so if this floor were lower than what a view
// actually needs, dragging a column narrow would clip its own content.
const MIN_COLUMN_WIDTH: Record<TaskViewMode, number> = { line: 288, card: 320 };
const MAX_COLUMN_WIDTH = 560;

export function SectionColumn({
  projectId,
  section,
  index,
  count,
  canManage,
  viewMode,
  onAddTask,
}: {
  projectId: string;
  section: Section;
  index: number;
  count: number;
  canManage: boolean;
  viewMode: TaskViewMode;
  onAddTask: () => void;
}) {
  const [page, setPage] = React.useState(1);
  const tasksQuery = useTasksBySectionQuery(section.id, page);
  const deleteMutation = useDeleteSectionMutation(projectId);
  const moveMutation = useUpdateSectionMutation(projectId);
  const moveTaskMutation = useMoveTaskToSectionMutation();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [isDropTarget, setIsDropTarget] = React.useState(false);
  const [width, setWidth] = useSectionColumnWidth(section.id);
  const columnRef = React.useRef<HTMLDivElement>(null);

  const sectionDrop = useSectionDropTarget(section, ({ sectionId, targetPosition }) =>
    moveMutation.mutate({ sectionId, payload: { position: targetPosition } })
  );

  const tasks = tasksQuery.data?.data ?? [];

  // Dropping directly on a task (see `TaskCardItem`/`TaskLineItem`) inserts
  // above/below that specific task via its own `position`. Dropping anywhere
  // else in the column (empty space, gaps between items) appends to the end
  // of this section's full list — `meta.total` is the true end regardless of
  // which page is currently loaded, unlike `tasks.length`.
  function handleReorder({
    taskId,
    fromSectionId,
    targetPosition,
  }: {
    taskId: string;
    fromSectionId: string;
    targetPosition: number;
  }) {
    if (fromSectionId === section.id) {
      moveTaskMutation.mutate({ taskId, position: targetPosition });
    } else {
      moveTaskMutation.mutate({ taskId, sectionId: section.id, position: targetPosition });
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDropTarget(false);
    const raw = e.dataTransfer.getData(TASK_DRAG_MIME);
    if (!raw) return;
    const { taskId, sectionId: fromSectionId } = JSON.parse(raw) as {
      taskId: string;
      sectionId: string;
    };
    const targetPosition = tasksQuery.data?.meta.total ?? tasks.length;
    handleReorder({ taskId, fromSectionId, targetPosition });
  }

  // The column itself is the drop target for both a task dropped into empty
  // space (appends to the end of this section) and another column being
  // reordered — `dragover` only exposes `dataTransfer.types`, not the
  // payload, so the MIME type is what tells the two gestures apart.
  function handleColumnDragOver(e: React.DragEvent) {
    if (canManage && e.dataTransfer.types.includes(SECTION_DRAG_MIME)) {
      sectionDrop.handleDragOver(e);
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDropTarget(true);
  }

  function handleColumnDragLeave(e: React.DragEvent) {
    if (canManage && e.dataTransfer.types.includes(SECTION_DRAG_MIME)) {
      sectionDrop.handleDragLeave(e);
      return;
    }
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDropTarget(false);
    }
  }

  function handleColumnDrop(e: React.DragEvent) {
    if (canManage && e.dataTransfer.types.includes(SECTION_DRAG_MIME)) {
      sectionDrop.handleDrop(e);
      return;
    }
    handleDrop(e);
  }

  function handleResizeStart(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const handle = e.currentTarget;
    const minWidth = MIN_COLUMN_WIDTH[viewMode];
    const startX = e.clientX;
    const startWidth = columnRef.current?.getBoundingClientRect().width ?? minWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    // Pointer capture keeps every move/up event routed to this handle even
    // once the cursor leaves its 12px hit area mid-drag — plain mouse events
    // depend on the browser re-hit-testing under the cursor on every move,
    // which is what made fast drags feel like they "stopped responding".
    handle.setPointerCapture(e.pointerId);

    function onPointerMove(moveEvent: PointerEvent) {
      const next = Math.min(
        MAX_COLUMN_WIDTH,
        Math.max(minWidth, startWidth + (moveEvent.clientX - startX))
      );
      setWidth(next);
    }
    function end() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
    }
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  return (
    <div
      ref={columnRef}
      onDragOver={handleColumnDragOver}
      onDragLeave={handleColumnDragLeave}
      onDrop={handleColumnDrop}
      style={width ? { flex: `0 0 ${width}px` } : undefined}
      className={cn(
        "relative flex flex-col rounded-lg border border-border/60 bg-muted/20 transition-colors",
        width ? "shrink-0" : cn("flex-1", viewMode === "card" ? "min-w-80" : "min-w-72"),
        isDropTarget ? "border-primary bg-primary/5" : "",
        sectionDrop.dropEdge === "left" && "shadow-[inset_2px_0_0_0_var(--primary)]",
        sectionDrop.dropEdge === "right" && "shadow-[inset_-2px_0_0_0_var(--primary)]"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <RoleGate allowed={canManage}>
            <span
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(SECTION_DRAG_MIME, JSON.stringify({ sectionId: section.id }));
                e.dataTransfer.effectAllowed = "move";
                setLiftedDragImage(e);
              }}
              title="Arraste para reordenar a coluna"
              className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
            >
              <GripVertical className="size-4" />
            </span>
          </RoleGate>
          <span className="truncate text-sm font-semibold text-foreground">{section.name}</span>
          {tasksQuery.data ? (
            <Badge variant="secondary">{tasksQuery.data.meta.total}</Badge>
          ) : null}
        </div>
        <RoleGate allowed={canManage}>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={index === 0 || moveMutation.isPending}
              onClick={() =>
                moveMutation.mutate({
                  sectionId: section.id,
                  payload: { position: section.position - 1 },
                })
              }
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={index === count - 1 || moveMutation.isPending}
              onClick={() =>
                moveMutation.mutate({
                  sectionId: section.id,
                  payload: { position: section.position + 1 },
                })
              }
            >
              <ChevronRight />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setRenameOpen(true)}>
              <Pencil />
            </Button>
            {!section.isDefault ? (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-xs">
                    <Trash2 className="text-destructive" />
                  </Button>
                }
                title="Apagar coluna"
                description="A coluna só pode ser apagada se estiver vazia. Mova ou apague as tarefas primeiro."
                confirmLabel="Apagar"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate(section.id)}
              />
            ) : null}
          </div>
        </RoleGate>
      </div>

      <div className="flex-1 space-y-2 p-2">
        {tasksQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : tasksQuery.isError ? (
          <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} />
        ) : tasks.length === 0 ? (
          <EmptyState
            className="py-8"
            icon={<ListChecks className="size-5" />}
            title="Nenhuma tarefa"
          />
        ) : (
          tasks.map((task) =>
            viewMode === "card" ? (
              <TaskCardItem key={task.id} task={task} onReorder={handleReorder} />
            ) : (
              <TaskLineItem key={task.id} task={task} onReorder={handleReorder} />
            )
          )
        )}
      </div>

      {tasksQuery.data ? (
        <div className="px-2 pb-2">
          <Pager
            meta={tasksQuery.data.meta}
            onPageChange={setPage}
            isLoading={tasksQuery.isFetching}
          />
        </div>
      ) : null}

      <RoleGate allowed={canManage}>
        <div className="border-t border-border/60 p-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onAddTask}>
            <Plus /> Nova tarefa
          </Button>
        </div>
      </RoleGate>

      <SectionFormDialog
        projectId={projectId}
        section={section}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <div
        role="separator"
        aria-orientation="vertical"
        title="Arraste para redimensionar (duplo clique para ajustar automaticamente)"
        onPointerDown={handleResizeStart}
        onDoubleClick={() => setWidth(null)}
        className="absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize touch-none select-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-primary/50"
      />
    </div>
  );
}
