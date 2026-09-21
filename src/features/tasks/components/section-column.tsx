"use client";

import * as React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ChevronDown, GripVertical, ListChecks, Maximize2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Pager } from "@/components/shared/pager";
import {
  useMoveTasksToSectionMutation,
  useMoveTaskToSectionMutation,
  useTasksBySectionQuery,
} from "@/features/tasks/hooks/use-tasks";
import { useTaskSelection } from "@/features/tasks/context/task-selection-context";
import { useDeleteSectionMutation, useUpdateSectionMutation } from "@/features/sections/hooks/use-sections";
import { useSectionDropTarget } from "@/features/sections/hooks/use-section-drop-target";
import { useSectionColumnWidth } from "@/features/tasks/hooks/use-section-column-width";
import { SectionFormDialog } from "@/features/sections/components/section-form-dialog";
import { SectionActionsBar } from "@/features/sections/components/section-actions-bar";
import { MoveSectionDialog } from "@/features/sections/components/move-section-dialog";
import { TaskCardItem } from "@/features/tasks/components/task-card-item";
import { TaskTable } from "@/features/tasks/components/task-table";
import type { TaskViewMode } from "@/features/tasks/hooks/use-task-view-mode";
import {
  applyTaskFilters,
  countActiveFilters,
  EMPTY_TASK_FILTERS,
  type TaskFilters,
} from "@/features/tasks/lib/task-filters";
import { setLiftedDragImage, TASK_DRAG_MIME, SECTION_DRAG_MIME } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { Section } from "@/types/section";

// Must stay >= the auto-layout minimums below (`min-w-80`/`min-w-230`) — a
// manually resized column skips those Tailwind classes entirely (see the
// className logic below), so if this floor were lower than what a view
// actually needs, dragging a column narrow would clip its own content.
// The table floor is the task table's `min-w-4xl` (896px) plus the column's
// borders and padding: columns are wide enough that the table never scrolls
// inside them, and the board's own scrollbar is the only horizontal one.
const MIN_COLUMN_WIDTH: Record<TaskViewMode, number> = { card: 320, table: 920 };

// Each section's root element carries `data-section-drop`. Nested sections
// render inside their parent's DOM, so drag events bubble to the parent too —
// each section only reacts to events whose nearest drop zone is its own.
const DROP_ZONE_SELECTOR = "[data-section-drop]";

const DIFFERENT_LEVEL_MESSAGE =
  "Arrastar só funciona entre colunas do mesmo nível. Para mover entre uma coluna e uma subcoluna, abra a tarefa e troque a coluna nela.";

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
  // `expanded` is the dedicated column page: the column fills the whole page
  // and lays its tasks out in a grid. `expandHref` is where the header's
  // expand control leads — the column's own page from the board, or back to the
  // project board when already `expanded`. Omit it to hide the control.
  expanded?: boolean;
  expandHref?: string;
  // Narrows the tasks shown in this column (and its sub-columns). The API
  // can't filter, so this only applies to the page of tasks currently loaded.
  filters?: TaskFilters;
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
  expanded = false,
  expandHref,
  filters = EMPTY_TASK_FILTERS,
}: SectionColumnProps) {
  const isNested = variant === "nested";
  const [page, setPage] = React.useState(1);
  const tasksQuery = useTasksBySectionQuery(section.id, page);
  const deleteMutation = useDeleteSectionMutation(projectId);
  const moveMutation = useUpdateSectionMutation(projectId);
  const moveTaskMutation = useMoveTaskToSectionMutation();
  const moveTasksMutation = useMoveTasksToSectionMutation();
  const selection = useTaskSelection();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [subsectionOpen, setSubsectionOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDropTarget, setIsDropTarget] = React.useState(false);
  // Whether a sub-column's own body is open (nested only). Sub-columns always
  // start visible: hidden behind a toggle, people never discover them.
  const [bodyOpen, setBodyOpen] = React.useState(true);
  const [width, setWidth] = useSectionColumnWidth(section.id);
  const columnRef = React.useRef<HTMLDivElement>(null);
  // A width saved under another view mode may be below this mode's minimum.
  const effectiveWidth = width ? Math.max(width, MIN_COLUMN_WIDTH[viewMode]) : null;

  const childSections = React.useMemo(
    () => allSections.filter((candidate) => candidate.parentId === section.id),
    [allSections, section.id]
  );

  const sectionDrop = useSectionDropTarget(section, ({ sectionId, targetPosition }) =>
    moveMutation.mutate({ sectionId, payload: { position: targetPosition } })
  );

  const loadedTasks = React.useMemo(() => tasksQuery.data?.data ?? [], [tasksQuery.data]);
  const tasks = React.useMemo(() => applyTaskFilters(loadedTasks, filters), [loadedTasks, filters]);
  const isFiltering = countActiveFilters(filters) > 0;
  const hiddenByFilters = loadedTasks.length - tasks.length;
  const emptyMessage = isFiltering && loadedTasks.length > 0
    ? "Nenhuma tarefa corresponde aos filtros."
    : undefined;

  // Dropping directly on a task (see `TaskCardItem`) inserts
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
    // Dragging one of several selected tasks drags the whole selection.
    if (selection.count > 1 && selection.isSelected(taskId)) {
      handleBulkDrop(targetPosition);
      return;
    }
    if (fromSectionId === section.id) {
      moveTaskMutation.mutate({ taskId, position: targetPosition });
      return;
    }
    // Prototype limit: a task only moves between sections that share the same
    // parent (root columns with each other, sub-sections of one parent with
    // each other) — never across nesting levels or between different accordions.
    if (parentIdOf(fromSectionId) !== section.parentId) {
      toast.info(DIFFERENT_LEVEL_MESSAGE);
      return;
    }
    moveTaskMutation.mutate({ taskId, sectionId: section.id, position: targetPosition });
  }

  function parentIdOf(sectionId: string) {
    return allSections.find((s) => s.id === sectionId)?.parentId ?? null;
  }

  // Same level rule as a single drag, applied to the whole selection: either
  // every task can land here or none moves. Tasks already in this column stay
  // put — a group can't be reordered within a column, only brought into it —
  // and the rest keep their relative order starting at the drop position.
  function handleBulkDrop(targetPosition: number) {
    const toMove = selection.tasks.filter((task) => task.sectionId !== section.id);
    if (toMove.some((task) => parentIdOf(task.sectionId) !== section.parentId)) {
      toast.info(DIFFERENT_LEVEL_MESSAGE);
      return;
    }
    if (toMove.length === 0) return;
    moveTasksMutation.mutate(
      { tasks: toMove, sectionId: section.id, position: targetPosition },
      { onSuccess: ({ movedIds }) => selection.deselect(movedIds) }
    );
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
    // An auto-sized (`flex-1`) column fills the board, so its starting width
    // can be anything up to the board's width. A fixed cap below that would
    // make the column jump the moment the drag starts and block widening it
    // back — the board's own width (never below the start width) is the limit.
    const boardWidth = columnRef.current?.parentElement?.clientWidth ?? startWidth;
    const maxWidth = Math.max(boardWidth, startWidth, minWidth);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    // Pointer capture keeps every move/up event routed to this handle even
    // once the cursor leaves its 12px hit area mid-drag — plain mouse events
    // depend on the browser re-hit-testing under the cursor on every move,
    // which is what made fast drags feel like they "stopped responding".
    handle.setPointerCapture(e.pointerId);

    function onPointerMove(moveEvent: PointerEvent) {
      const next = Math.min(
        maxWidth,
        Math.max(minWidth, startWidth + (moveEvent.clientX - startX))
      );
      setWidth(Math.round(next));
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

  const hasChildren = childSections.length > 0;
  // With sub-columns below, an empty direct list would only add a big
  // "no tasks" block above them — the sub-columns speak for themselves.
  const hideTaskList =
    hasChildren &&
    viewMode !== "table" &&
    !tasksQuery.isLoading &&
    !tasksQuery.isError &&
    !emptyMessage &&
    tasks.length === 0;
  // Header controls appear on hover/focus (or while their menu is open), and
  // stay visible on touch screens where there is no hover.
  const revealOnHover =
    "transition-opacity opacity-0 group-hover/header:opacity-100 group-focus-within/header:opacity-100 has-[[data-state=open]]:opacity-100 [@media(hover:none)]:opacity-100";

  // Picks (or drops) every task this column currently shows. The table view has
  // its own control in the table header, so this is the cards view's only.
  const selectedHere = tasks.filter((task) => selection.isSelected(task.id)).length;
  const selectAllCheckbox =
    viewMode === "card" && tasks.length > 0 ? (
      <Checkbox
        checked={selectedHere === tasks.length ? true : selectedHere > 0 ? "indeterminate" : false}
        aria-label={`Selecionar todas as tarefas de ${section.name}`}
        onCheckedChange={() =>
          selectedHere === tasks.length
            ? selection.deselect(tasks.map((task) => task.id))
            : selection.select(tasks)
        }
        className={cn("shrink-0", selection.count === 0 && revealOnHover)}
      />
    ) : null;

  return (
    <div
      data-section-drop=""
      ref={columnRef}
      onDragOver={handleColumnDragOver}
      onDragLeave={handleColumnDragLeave}
      onDrop={handleColumnDrop}
      style={
        !isNested && !expanded && effectiveWidth ? { flex: `0 0 ${effectiveWidth}px` } : undefined
      }
      className={cn(
        "relative flex flex-col transition-colors",
        // Sub-columns are plain groups inside their parent — no box of their own.
        isNested
          ? "rounded-md"
          : "rounded-lg border border-border/60 bg-muted/20",
        !isNested &&
          (expanded
            ? "w-full min-w-0 flex-1"
            : effectiveWidth
              ? "shrink-0"
              : viewMode === "table"
                ? "flex-1 min-w-230"
                : "flex-1 min-w-80"),
        isDropTarget && (isNested ? "bg-primary/5 ring-1 ring-primary/50" : "border-primary bg-primary/5"),
        sectionDrop.dropEdge === "left" && "shadow-[inset_2px_0_0_0_var(--primary)]",
        sectionDrop.dropEdge === "right" && "shadow-[inset_-2px_0_0_0_var(--primary)]"
      )}
    >
      <div
        className={cn(
          "group/header flex items-center justify-between gap-2",
          isNested ? "px-1 py-1" : "px-3 py-2",
          !isNested && "border-b border-border/60"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isNested ? selectAllCheckbox : null}
          {isNested ? (
            // The whole title is the toggle, not just the small chevron.
            <button
              type="button"
              aria-expanded={bodyOpen}
              aria-label={`${bodyOpen ? "Recolher" : "Expandir"} a subcoluna ${section.name}`}
              onClick={() => setBodyOpen((open) => !open)}
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  !bodyOpen && "-rotate-90"
                )}
              />
              <span className="truncate text-sm font-semibold text-foreground">
                {section.name}
              </span>
              {tasksQuery.data ? (
                <Badge variant="secondary">{tasksQuery.data.meta.total}</Badge>
              ) : null}
            </button>
          ) : expanded ? null : (
            <RoleGate allowed={canManage}>
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    SECTION_DRAG_MIME,
                    JSON.stringify({ sectionId: section.id })
                  );
                  e.dataTransfer.effectAllowed = "move";
                  setLiftedDragImage(e, columnRef.current);
                }}
                title="Arraste para reordenar a coluna"
                className={cn(
                  "shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing",
                  revealOnHover
                )}
              >
                <GripVertical className="size-4" />
              </span>
            </RoleGate>
          )}
          {!isNested ? (
            <>
              {selectAllCheckbox}
              <span className="truncate text-sm font-semibold text-foreground">
                {section.name}
              </span>
              {tasksQuery.data ? (
                <Badge variant="secondary">{tasksQuery.data.meta.total}</Badge>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center">
          {!isNested && expandHref && expanded ? (
            <Button variant="ghost" size="xs" asChild>
              <Link href={expandHref}>
                <ArrowLeft /> Voltar ao projeto
              </Link>
            </Button>
          ) : null}
          {!isNested && expandHref && !expanded ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs" className={revealOnHover} asChild>
                  <Link href={expandHref} aria-label="Abrir coluna em página própria">
                    <Maximize2 />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir coluna em página própria</TooltipContent>
            </Tooltip>
          ) : null}
          <RoleGate allowed={canManage}>
            <div className={revealOnHover}>
            <SectionActionsBar
              onRename={() => setRenameOpen(true)}
              onCreateSubsection={() => setSubsectionOpen(true)}
              onMove={() => setMoveOpen(true)}
              // Reordering is for board columns only; nested ones omit the props
              // so the arrows aren't rendered at all.
              {...(!isNested && {
                onMoveLeft:
                  index > 0 && !moveMutation.isPending
                    ? () =>
                        moveMutation.mutate({
                          sectionId: section.id,
                          payload: { position: section.position - 1 },
                        })
                    : null,
                onMoveRight:
                  index < count - 1 && !moveMutation.isPending
                    ? () =>
                        moveMutation.mutate({
                          sectionId: section.id,
                          payload: { position: section.position + 1 },
                        })
                    : null,
              })}
              onDelete={!section.isDefault ? () => setDeleteOpen(true) : null}
            />
            </div>
          </RoleGate>
        </div>
      </div>

      {!isNested || bodyOpen ? (
        <>
          {/* With sub-columns present, say which tasks belong to this level. */}
          {hasChildren && !hideTaskList ? (
            <p className="px-3 pt-2 text-xs font-medium text-muted-foreground">
              Tarefas desta coluna
            </p>
          ) : null}

          {/* Expanded, the column is wide: lay tasks out in a grid instead of one long stack. */}
          <div
            className={cn(
              "flex-1",
              isNested ? "px-1 py-1" : "p-2",
              expanded && viewMode === "card"
                ? "grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-3"
                : "space-y-2",
              hideTaskList && "hidden"
            )}
          >
            {tasksQuery.isLoading ? (
              <div className="col-span-full space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : tasksQuery.isError ? (
              <div className="col-span-full">
                <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} />
              </div>
            ) : viewMode === "table" ? (
              <TaskTable
                projectId={projectId}
                sectionId={section.id}
                tasks={tasks}
                canManage={canManage}
                emptyMessage={emptyMessage}
                // On the board the column is always wide enough for the table
                // and the board scrolls; the dedicated page has no such guarantee.
                scrollable={expanded}
              />
            ) : tasks.length === 0 ? (
              <EmptyState
                className="col-span-full py-8"
                icon={<ListChecks className="size-5" />}
                title={emptyMessage ?? "Nenhuma tarefa aqui ainda"}
                description={
                  emptyMessage
                    ? "Mude ou limpe os filtros para ver as tarefas desta coluna."
                    : canManage
                      ? expanded
                        ? "Use “Nova tarefa” abaixo para adicionar a primeira."
                        : "Use “Nova tarefa” abaixo ou arraste uma tarefa de outra coluna para cá."
                      : undefined
                }
              />
            ) : (
              tasks.map((task) => (
                <TaskCardItem key={task.id} task={task} onReorder={handleReorder} />
              ))
            )}
          </div>

          {isFiltering && hiddenByFilters > 0 ? (
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              {hiddenByFilters === 1
                ? "1 tarefa escondida pelos filtros"
                : `${hiddenByFilters} tarefas escondidas pelos filtros`}
              {tasksQuery.data && tasksQuery.data.meta.totalPages > 1
                ? " (só as desta página são filtradas)."
                : "."}
            </p>
          ) : null}

          {tasksQuery.data ? (
            <div className="px-2 pb-2">
              <Pager
                meta={tasksQuery.data.meta}
                onPageChange={setPage}
                isLoading={tasksQuery.isFetching}
              />
            </div>
          ) : null}

          {/* "Nova subcoluna" lives in the "⋯" menu, so the footer is one quiet button. */}
          <RoleGate allowed={canManage}>
            <div className={cn("pb-1", isNested ? "px-1" : "px-2")}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onAddTask(section.id)}
              >
                <Plus /> Nova tarefa
              </Button>
            </div>
          </RoleGate>

          {hasChildren ? (
            // Sub-columns are plain groups split by thin dividers — no boxes.
            <div className="mx-2 mb-1 divide-y divide-border/60 border-t border-border/60">
              {childSections.map((child) => (
                <div key={child.id} className="py-1">
                  <SectionColumn
                    projectId={projectId}
                    section={child}
                    allSections={allSections}
                    variant="nested"
                    canManage={canManage}
                    viewMode={viewMode}
                    onAddTask={onAddTask}
                    filters={filters}
                  />
                </div>
              ))}
            </div>
          ) : null}
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
        onOpenChange={setSubsectionOpen}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        trigger={<span className="hidden" />}
        title={`Apagar a coluna “${section.name}”?`}
        description="A coluna só pode ser apagada se estiver vazia. Mova ou apague as tarefas e as subcolunas primeiro."
        confirmLabel="Apagar coluna"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(section.id)}
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

      {!isNested && !expanded ? (
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
