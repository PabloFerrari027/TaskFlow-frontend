"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ChevronDown,
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
import { SectionActionsMenu } from "@/features/sections/components/section-actions-menu";
import { MoveSectionDialog } from "@/features/sections/components/move-section-dialog";
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

// Each section's root element carries `data-section-drop`. Nested sections
// render inside their parent's DOM, so drag events bubble to the parent too —
// each section only reacts to events whose nearest drop zone is its own.
const DROP_ZONE_SELECTOR = "[data-section-drop]";

interface SectionColumnProps {
  projectId: string;
  section: Section;
  // Every section of the project (root and nested), position-sorted. Used to
  // find this section's sub-sections and to validate task drops between levels.
  allSections: Section[];
  // "column" is a root section rendered as a board column. "nested" is a
  // sub-section rendered as a collapsible accordion item inside its parent.
  variant?: "column" | "nested";
  // Position among the root columns — only used by the "column" variant.
  index?: number;
  count?: number;
  canManage: boolean;
  viewMode: TaskViewMode;
  onAddTask: (sectionId: string) => void;
}

export function SectionColumn({
  projectId,
  section,
  allSections,
  variant = "column",
  index = 0,
  count = 1,
  canManage,
  viewMode,
  onAddTask,
}: SectionColumnProps) {
  const isNested = variant === "nested";
  const [page, setPage] = React.useState(1);
  const tasksQuery = useTasksBySectionQuery(section.id, page);
  const deleteMutation = useDeleteSectionMutation(projectId);
  const moveMutation = useUpdateSectionMutation(projectId);
  const moveTaskMutation = useMoveTaskToSectionMutation();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [subsectionOpen, setSubsectionOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [isDropTarget, setIsDropTarget] = React.useState(false);
  // Accordion state: whether this section's own body is open (nested only) and
  // whether its sub-sections are shown (any section that has some).
  const [bodyOpen, setBodyOpen] = React.useState(true);
  const [subsectionsOpen, setSubsectionsOpen] = React.useState(false);
  const [width, setWidth] = useSectionColumnWidth(section.id);
  const columnRef = React.useRef<HTMLDivElement>(null);

  const childSections = React.useMemo(
    () => allSections.filter((candidate) => candidate.parentId === section.id),
    [allSections, section.id]
  );

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
      return;
    }
    // Prototype limit: a task only moves between sections that share the same
    // parent (root columns with each other, sub-sections of one parent with
    // each other) — never across nesting levels or between different accordions.
    const fromParentId = allSections.find((s) => s.id === fromSectionId)?.parentId ?? null;
    if (fromParentId !== section.parentId) {
      toast.info(
        "Nesta versão, tarefas só podem ser movidas entre seções do mesmo nível. Use o seletor de seção na própria tarefa para mover entre níveis."
      );
      return;
    }
    moveTaskMutation.mutate({ taskId, sectionId: section.id, position: targetPosition });
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

  function isOwnDropZone(e: React.DragEvent) {
    return (e.target as HTMLElement).closest(DROP_ZONE_SELECTOR) === e.currentTarget;
  }

  // Whole-column reordering (drag by the grip) only exists for root columns.
  function isColumnReorder(e: React.DragEvent) {
    return !isNested && canManage && e.dataTransfer.types.includes(SECTION_DRAG_MIME);
  }

  // The column itself is the drop target for both a task dropped into empty
  // space (appends to the end of this section) and another column being
  // reordered — `dragover` only exposes `dataTransfer.types`, not the
  // payload, so the MIME type is what tells the two gestures apart.
  function handleColumnDragOver(e: React.DragEvent) {
    if (!isOwnDropZone(e)) {
      // Hovering a nested section: it owns the drop, so don't highlight this one.
      setIsDropTarget(false);
      return;
    }
    if (isColumnReorder(e)) {
      sectionDrop.handleDragOver(e);
      return;
    }
    // A column being dragged can't be dropped into a sub-section (this
    // prototype doesn't nest columns by dragging) — leave it non-droppable.
    if (e.dataTransfer.types.includes(SECTION_DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDropTarget(true);
  }

  function handleColumnDragLeave(e: React.DragEvent) {
    if (isColumnReorder(e)) {
      sectionDrop.handleDragLeave(e);
      return;
    }
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDropTarget(false);
    }
  }

  function handleColumnDrop(e: React.DragEvent) {
    if (!isOwnDropZone(e)) return;
    if (isColumnReorder(e)) {
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

  const subsectionsToggle =
    childSections.length > 0 ? (
      <Button
        variant="ghost"
        size="xs"
        aria-expanded={subsectionsOpen}
        onClick={() => setSubsectionsOpen((open) => !open)}
      >
        <ChevronDown className={cn("transition-transform", !subsectionsOpen && "-rotate-90")} />
        {`+${childSections.length} ${childSections.length === 1 ? "subseção" : "subseções"}`}
      </Button>
    ) : null;

  return (
    <div
      data-section-drop=""
      ref={columnRef}
      onDragOver={handleColumnDragOver}
      onDragLeave={handleColumnDragLeave}
      onDrop={handleColumnDrop}
      style={!isNested && width ? { flex: `0 0 ${width}px` } : undefined}
      className={cn(
        "relative flex flex-col rounded-lg border border-border/60 transition-colors",
        isNested ? "bg-background" : "bg-muted/20",
        !isNested &&
          (width ? "shrink-0" : cn("flex-1", viewMode === "card" ? "min-w-80" : "min-w-72")),
        isDropTarget ? "border-primary bg-primary/5" : "",
        sectionDrop.dropEdge === "left" && "shadow-[inset_2px_0_0_0_var(--primary)]",
        sectionDrop.dropEdge === "right" && "shadow-[inset_-2px_0_0_0_var(--primary)]"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2",
          (!isNested || bodyOpen) && "border-b border-border/60"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isNested ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-expanded={bodyOpen}
              aria-label={bodyOpen ? "Recolher subseção" : "Expandir subseção"}
              onClick={() => setBodyOpen((open) => !open)}
            >
              <ChevronDown className={cn("transition-transform", !bodyOpen && "-rotate-90")} />
            </Button>
          ) : (
            <RoleGate allowed={canManage}>
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    SECTION_DRAG_MIME,
                    JSON.stringify({ sectionId: section.id })
                  );
                  e.dataTransfer.effectAllowed = "move";
                  setLiftedDragImage(e);
                }}
                title="Arraste para reordenar a coluna"
                className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </span>
            </RoleGate>
          )}
          <span className="truncate text-sm font-semibold text-foreground">{section.name}</span>
          {tasksQuery.data ? (
            <Badge variant="secondary">{tasksQuery.data.meta.total}</Badge>
          ) : null}
        </div>
        <RoleGate allowed={canManage}>
          <div className="flex shrink-0 items-center gap-0.5">
            {!isNested ? (
              <>
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
              </>
            ) : null}
            <Button variant="ghost" size="icon-xs" onClick={() => setRenameOpen(true)}>
              <Pencil />
            </Button>
            <SectionActionsMenu
              sectionName={section.name}
              onCreateSubsection={() => setSubsectionOpen(true)}
              onMove={() => setMoveOpen(true)}
            />
            {!section.isDefault ? (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-xs">
                    <Trash2 className="text-destructive" />
                  </Button>
                }
                title="Apagar coluna"
                description="A coluna só pode ser apagada se estiver vazia. Mova ou apague as tarefas e as subseções primeiro."
                confirmLabel="Apagar"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate(section.id)}
              />
            ) : null}
          </div>
        </RoleGate>
      </div>

      {!isNested || bodyOpen ? (
        <>
          {subsectionsToggle ? (
            <div className="flex items-center gap-1.5 border-b border-border/60 px-2 py-1">
              {subsectionsToggle}
              <Badge variant="outline">Protótipo</Badge>
            </div>
          ) : null}

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

          {subsectionsOpen && childSections.length > 0 ? (
            <div className="space-y-2 border-t border-border/60 p-2">
              {childSections.map((child) => (
                <SectionColumn
                  key={child.id}
                  projectId={projectId}
                  section={child}
                  allSections={allSections}
                  variant="nested"
                  canManage={canManage}
                  viewMode={viewMode}
                  onAddTask={onAddTask}
                />
              ))}
            </div>
          ) : null}

          <RoleGate allowed={canManage}>
            <div className="border-t border-border/60 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAddTask(section.id)}
              >
                <Plus /> Nova tarefa
              </Button>
            </div>
          </RoleGate>
        </>
      ) : null}

      <SectionFormDialog
        projectId={projectId}
        section={section}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <SectionFormDialog
        projectId={projectId}
        parent={section}
        open={subsectionOpen}
        onOpenChange={(open) => {
          setSubsectionOpen(open);
          if (!open) setSubsectionsOpen(true);
        }}
      />
      {moveOpen ? (
        <MoveSectionDialog
          projectId={projectId}
          section={section}
          sections={allSections}
          open
          onOpenChange={setMoveOpen}
        />
      ) : null}

      {!isNested ? (
        <div
          role="separator"
          aria-orientation="vertical"
          title="Arraste para redimensionar (duplo clique para ajustar automaticamente)"
          onPointerDown={handleResizeStart}
          onDoubleClick={() => setWidth(null)}
          className="absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize touch-none select-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-primary/50"
        />
      ) : null}
    </div>
  );
}
