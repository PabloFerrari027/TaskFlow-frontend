import { NO_PRIORITY_VALUE, UNASSIGNED_VALUE } from "@/features/tasks/schemas";
import { EMPTY_TASK_FILTERS, type TaskFilters } from "@/features/tasks/lib/task-filters";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import type { TaskPriority } from "@/types/task";
import type { SavedViewConfig } from "@/types/saved-view";

// The board's due presets, as the view's relative window. Ours to define (the
// client applies the filters): 0 = today, N > 0 = within the next N days,
// -365 = already overdue.
const DUE_PRESET_DAYS = { today: 0, next7: 7, overdue: -365 } as const;

/** What the board's filters can't put in a saved view — the person is told. */
export function unsavableFilterLabels(filters: TaskFilters): string[] {
  const labels: string[] = [];
  if (filters.priorities.includes(NO_PRIORITY_VALUE)) labels.push("“sem prioridade”");
  if (filters.due === "none") labels.push("“sem prazo”");
  if (filters.createdFrom || filters.createdTo) labels.push("data de criação");
  if (filters.updatedFrom || filters.updatedTo) labels.push("data de atualização");
  if (filters.participantId) labels.push("participante");
  if (filters.mentionedId) labels.push("menção");
  if (filters.createdBy) labels.push("quem criou");
  if (filters.attachments !== "any") labels.push("anexos");
  if (filters.description !== "any") labels.push("descrição");
  if (filters.kind === "subtasks") labels.push("só subtarefas");
  return labels;
}

export function filtersToViewConfig(filters: TaskFilters): Partial<SavedViewConfig> {
  const priorities = filters.priorities.filter(
    (p): p is TaskPriority => p !== NO_PRIORITY_VALUE
  );
  const assigneeIds = filters.assignees.filter((id) => id !== UNASSIGNED_VALUE);
  const presetDays =
    filters.due === "today" || filters.due === "next7" || filters.due === "overdue"
      ? DUE_PRESET_DAYS[filters.due]
      : undefined;

  return {
    filters: {
      text: filters.search.trim() || undefined,
      status: filters.statuses.length ? filters.statuses : undefined,
      priority: priorities.length ? priorities : undefined,
      assigneeIds: assigneeIds.length ? assigneeIds : undefined,
      unassigned: filters.assignees.includes(UNASSIGNED_VALUE) || undefined,
      dueWithinDays: presetDays,
      dueFrom: filters.dueFrom ? fromDateInputValue(filters.dueFrom) : undefined,
      dueTo: filters.dueTo ? fromDateInputValue(filters.dueTo) : undefined,
    },
    showSubtasks: filters.kind !== "tasks",
  };
}

export function viewConfigToFilters(config: SavedViewConfig): TaskFilters {
  const f = config.filters ?? {};
  const due =
    f.dueWithinDays === 0
      ? "today"
      : f.dueWithinDays === 7
        ? "next7"
        : f.dueWithinDays !== undefined && f.dueWithinDays < 0
          ? "overdue"
          : "any";

  return {
    ...EMPTY_TASK_FILTERS,
    search: f.text ?? "",
    statuses: f.status ?? [],
    priorities: f.priority ?? [],
    assignees: [...(f.assigneeIds ?? []), ...(f.unassigned ? [UNASSIGNED_VALUE] : [])],
    due,
    dueFrom: f.dueFrom ? toDateInputValue(f.dueFrom) : "",
    dueTo: f.dueTo ? toDateInputValue(f.dueTo) : "",
    kind: config.showSubtasks === false ? "tasks" : "any",
  };
}
