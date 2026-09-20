import { differenceInCalendarDays } from "date-fns";
import { NO_PRIORITY_VALUE, UNASSIGNED_VALUE } from "@/features/tasks/schemas";
import { toDateInputValue } from "@/lib/format";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

export type TriState = "any" | "yes" | "no";
export type DuePreset = "any" | "overdue" | "today" | "next7" | "none";
export type TaskKind = "any" | "tasks" | "subtasks";

export interface TaskFilters {
  search: string;
  statuses: TaskStatus[];
  /** `NO_PRIORITY_VALUE` matches tasks without a priority. */
  priorities: Array<TaskPriority | typeof NO_PRIORITY_VALUE>;
  /** User ids; `UNASSIGNED_VALUE` matches tasks without an assignee. */
  assignees: string[];
  due: DuePreset;
  // The date ranges below are `yyyy-MM-dd` (what `<input type="date">` gives);
  // an empty string means that end of the range is open.
  dueFrom: string;
  dueTo: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  /** A user id, or "" for anyone. */
  participantId: string;
  mentionedId: string;
  createdBy: string;
  attachments: TriState;
  description: TriState;
  kind: TaskKind;
}

export const EMPTY_TASK_FILTERS: TaskFilters = {
  search: "",
  statuses: [],
  priorities: [],
  assignees: [],
  due: "any",
  dueFrom: "",
  dueTo: "",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
  participantId: "",
  mentionedId: "",
  createdBy: "",
  attachments: "any",
  description: "any",
  kind: "any",
};

// Filters that live inside the "Mais filtros" popover rather than the toolbar.
const ADVANCED_ACTIVE_CHECKS: Array<(filters: TaskFilters) => boolean> = [
  (f) => Boolean(f.dueFrom || f.dueTo),
  (f) => Boolean(f.createdFrom || f.createdTo),
  (f) => Boolean(f.updatedFrom || f.updatedTo),
  (f) => Boolean(f.participantId),
  (f) => Boolean(f.mentionedId),
  (f) => Boolean(f.createdBy),
  (f) => f.attachments !== "any",
  (f) => f.description !== "any",
  (f) => f.kind !== "any",
];

const PRIMARY_ACTIVE_CHECKS: Array<(filters: TaskFilters) => boolean> = [
  (f) => f.search.trim().length > 0,
  (f) => f.statuses.length > 0,
  (f) => f.priorities.length > 0,
  (f) => f.assignees.length > 0,
  (f) => f.due !== "any",
];

export function countAdvancedFilters(filters: TaskFilters) {
  return ADVANCED_ACTIVE_CHECKS.filter((isActive) => isActive(filters)).length;
}

export function countActiveFilters(filters: TaskFilters) {
  return (
    PRIMARY_ACTIVE_CHECKS.filter((isActive) => isActive(filters)).length +
    countAdvancedFilters(filters)
  );
}

// "Ação" and "acao" should find each other.
function normalizeText(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesTriState(state: TriState, has: boolean) {
  return state === "any" || (state === "yes") === has;
}

// Compared as the same local `yyyy-MM-dd` day the table's date cells show, so a
// filter never disagrees with what the user sees on the task.
function inDayRange(value: string | null, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;
  const day = toDateInputValue(value);
  if (!day) return false;
  return (!from || day >= from) && (!to || day <= to);
}

function matchesDuePreset(task: Task, due: DuePreset) {
  if (due === "any") return true;
  if (due === "none") return !task.dueDate;
  if (!task.dueDate) return false;
  const daysUntil = differenceInCalendarDays(new Date(task.dueDate), new Date());
  // A finished task with a past due date isn't late anymore.
  if (due === "overdue") return daysUntil < 0 && task.status !== "DONE";
  if (due === "today") return daysUntil === 0;
  return daysUntil >= 0 && daysUntil <= 7;
}

export function matchesTaskFilters(task: Task, filters: TaskFilters) {
  const query = normalizeText(filters.search.trim());
  if (query) {
    const haystack = normalizeText(`${task.title}\n${task.description ?? ""}`);
    if (!haystack.includes(query)) return false;
  }

  if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false;

  if (filters.priorities.length > 0) {
    const priority = task.priority ?? NO_PRIORITY_VALUE;
    if (!filters.priorities.includes(priority)) return false;
  }

  if (filters.assignees.length > 0) {
    const assignee = task.assigneeId ?? UNASSIGNED_VALUE;
    if (!filters.assignees.includes(assignee)) return false;
  }

  if (!matchesDuePreset(task, filters.due)) return false;
  if (!inDayRange(task.dueDate, filters.dueFrom, filters.dueTo)) return false;
  if (!inDayRange(task.createdAt, filters.createdFrom, filters.createdTo)) return false;
  if (!inDayRange(task.updatedAt, filters.updatedFrom, filters.updatedTo)) return false;

  if (filters.participantId && !task.participantIds.includes(filters.participantId)) return false;
  if (filters.mentionedId && !task.mentionedUserIds.includes(filters.mentionedId)) return false;
  if (filters.createdBy && task.createdBy !== filters.createdBy) return false;

  if (!matchesTriState(filters.attachments, task.attachments.length > 0)) return false;
  if (!matchesTriState(filters.description, Boolean(task.description?.trim()))) return false;

  if (filters.kind === "tasks" && task.parentTaskId) return false;
  if (filters.kind === "subtasks" && !task.parentTaskId) return false;

  return true;
}

export function applyTaskFilters(tasks: Task[], filters: TaskFilters) {
  return countActiveFilters(filters) === 0
    ? tasks
    : tasks.filter((task) => matchesTaskFilters(task, filters));
}
