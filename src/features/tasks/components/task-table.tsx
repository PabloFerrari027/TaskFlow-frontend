"use client";

import * as React from "react";
import { Loader2, PanelRightOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TaskPriorityBadge,
  TaskStatusBadge,
} from "@/components/shared/status-badge";
import { AssigneeSelect } from "@/features/tasks/components/assignee-select";
import { useTaskSelection } from "@/features/tasks/context/task-selection-context";
import { TaskTitleCell } from "@/features/tasks/components/task-inline-text-fields";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";
import {
  useChangeTaskStatusMutation,
  useCreateTaskMutation,
  useUnassignTaskMutation,
  useUpdateTaskMutation,
} from "@/features/tasks/hooks/use-tasks";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

// Cells look like plain table text until hovered or focused, like a spreadsheet.
const CELL_TRIGGER_CLASS =
  "w-full border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent dark:hover:bg-input/30";
const CELL_CLASS = "border-r border-border/60 p-0.5! last:border-r-0";

function StatusCell({ task }: { task: Task }) {
  const mutation = useChangeTaskStatusMutation(task.id, { silent: true });

  return (
    <Select
      value={task.status}
      disabled={mutation.isPending}
      onValueChange={(next) => mutation.mutate({ status: next as TaskStatus })}
    >
      <SelectTrigger aria-label="Status da tarefa" className={CELL_TRIGGER_CLASS}>
        <SelectValue>
          <TaskStatusBadge status={task.status} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((status) => (
          <SelectItem key={status} value={status}>
            {TASK_STATUS_LABEL[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Same set-only rule as `TaskPrioritySelect`: the API can't clear a priority,
// so "Sem prioridade" is only a placeholder that goes away once one is chosen.
function PriorityCell({ task }: { task: Task }) {
  const mutation = useUpdateTaskMutation(task.id, { silent: true });

  return (
    <Select
      value={task.priority ?? ""}
      disabled={mutation.isPending}
      onValueChange={(next) => mutation.mutate({ priority: next as TaskPriority })}
    >
      <SelectTrigger aria-label="Prioridade da tarefa" className={CELL_TRIGGER_CLASS}>
        <SelectValue placeholder="Sem prioridade">
          {task.priority ? <TaskPriorityBadge priority={task.priority} /> : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((priority) => (
          <SelectItem key={priority} value={priority}>
            {TASK_PRIORITY_LABEL[priority]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Clearing goes through the dedicated unassign call — see `TaskAssigneeSelect`.
function AssigneeCell({ projectId, task }: { projectId: string; task: Task }) {
  const updateMutation = useUpdateTaskMutation(task.id, { silent: true });
  const unassignMutation = useUnassignTaskMutation(task.id, { silent: true });
  const isPending = updateMutation.isPending || unassignMutation.isPending;

  return (
    <div className={cn(isPending && "pointer-events-none opacity-60")}>
      <AssigneeSelect
        projectId={projectId}
        value={task.assigneeId ?? undefined}
        triggerClassName={CELL_TRIGGER_CLASS}
        onChange={(next) => {
          if (next === (task.assigneeId ?? undefined)) return;
          if (next) updateMutation.mutate({ assigneeId: next });
          else unassignMutation.mutate();
        }}
      />
    </div>
  );
}

// Set-only like the priority (the API can't clear a due date). Committed on
// blur/Enter rather than on every change: typing a year into a native date
// input fires a valid `change` for each intermediate value.
function DueDateCell({ task }: { task: Task }) {
  const mutation = useUpdateTaskMutation(task.id, { silent: true });
  const [draft, setDraft] = React.useState<string | null>(null);
  const serverValue = toDateInputValue(task.dueDate);

  function commit() {
    if (draft && draft !== serverValue) {
      mutation.mutate({ dueDate: fromDateInputValue(draft) });
    }
    setDraft(null);
  }

  return (
    <Input
      type="date"
      aria-label="Prazo da tarefa"
      value={draft ?? serverValue}
      disabled={mutation.isPending}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
      }}
      className="h-8 border-transparent bg-transparent px-2 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
    />
  );
}

function TaskRow({ projectId, task }: { projectId: string; task: Task }) {
  const { openTask } = useTaskPanel();
  const selection = useTaskSelection();
  const isSelected = selection.isSelected(task.id);

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell className={cn(CELL_CLASS, "text-center")}>
        <Checkbox
          className="mx-auto"
          checked={isSelected}
          aria-label={`Selecionar a tarefa “${task.title}”`}
          onCheckedChange={() => selection.toggle(task)}
        />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <TaskTitleCell taskId={task.id} title={task.title} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <StatusCell task={task} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <PriorityCell task={task} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <AssigneeCell projectId={projectId} task={task} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <DueDateCell task={task} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "text-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Abrir a tarefa “${task.title}”`}
              onClick={() => openTask(task.id)}
            >
              <PanelRightOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Abrir detalhes</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// Last row of the table: type a title and press Enter to add a task, and the
// field stays focused for the next one.
function QuickAddRow({ projectId, sectionId }: { projectId: string; sectionId: string }) {
  const createMutation = useCreateTaskMutation(projectId, { silent: true });
  const [title, setTitle] = React.useState("");

  function submit() {
    const next = title.trim();
    if (!next || createMutation.isPending) return;
    createMutation.mutate({ title: next, sectionId }, { onSuccess: () => setTitle("") });
  }

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={7} className="p-0.5!">
        <div className="relative">
          <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Título da nova tarefa"
            placeholder="Nova tarefa — digite o título e pressione Enter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") setTitle("");
            }}
            className="h-8 border-transparent bg-transparent pl-8 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
          />
          {createMutation.isPending ? (
            <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

const HEAD_CLASS = "h-9! border-r border-border/60 px-2.5 text-xs text-muted-foreground last:border-r-0";

/**
 * Spreadsheet-style view of one column's tasks: every cell edits in place and
 * saves on its own. Rows aren't draggable here — reordering stays on the cards view.
 */
export function TaskTable({
  projectId,
  sectionId,
  tasks,
  canManage,
  emptyMessage = "Nenhuma tarefa aqui ainda.",
  scrollable = true,
}: {
  projectId: string;
  sectionId: string;
  tasks: Task[];
  canManage: boolean;
  emptyMessage?: string;
  // The table has a minimum width. When the parent already guarantees that
  // width and owns the horizontal scroll (the board), pass `false` so the table
  // doesn't grow a second scrollbar of its own inside the column.
  scrollable?: boolean;
}) {
  const selection = useTaskSelection();
  const selectedHere = tasks.filter((task) => selection.isSelected(task.id)).length;
  const allSelected = tasks.length > 0 && selectedHere === tasks.length;

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-background",
        !scrollable && "**:data-[slot=table-container]:overflow-visible"
      )}
    >
      <Table className="min-w-4xl table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(HEAD_CLASS, "w-10 px-0.5!")}>
              <Checkbox
                className="mx-auto"
                checked={allSelected ? true : selectedHere > 0 ? "indeterminate" : false}
                disabled={tasks.length === 0}
                aria-label="Selecionar todas as tarefas desta coluna"
                onCheckedChange={() =>
                  allSelected
                    ? selection.deselect(tasks.map((task) => task.id))
                    : selection.select(tasks)
                }
              />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-auto")}>Tarefa</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-44")}>Status</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-40")}>Prioridade</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-48")}>Responsável</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-40")}>Prazo</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-12")}>
              <span className="sr-only">Abrir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => <TaskRow key={task.id} projectId={projectId} task={task} />)
          )}
          {canManage ? <QuickAddRow projectId={projectId} sectionId={sectionId} /> : null}
        </TableBody>
      </Table>
    </div>
  );
}
