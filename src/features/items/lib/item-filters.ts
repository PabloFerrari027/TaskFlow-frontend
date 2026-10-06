import { differenceInCalendarDays } from "date-fns";
import { NO_PRIORITY_VALUE, UNASSIGNED_VALUE } from "@/features/items/schemas";
import { toDateInputValue } from "@/lib/format";
import type { Item, ItemPriority, ItemStatus } from "@/types/item";

export type TriState = "any" | "yes" | "no";
export type DuePreset = "any" | "overdue" | "today" | "next7" | "none";
export type ItemKind = "any" | "items" | "subitems";

export interface ItemFilters {
  search: string;
  statuses: ItemStatus[];
  /** `NO_PRIORITY_VALUE` matches items without a priority. */
  priorities: Array<ItemPriority | typeof NO_PRIORITY_VALUE>;
  /** User ids; `UNASSIGNED_VALUE` matches items without an assignee. */
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
  kind: ItemKind;
}

export const EMPTY_ITEM_FILTERS: ItemFilters = {
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
const ADVANCED_ACTIVE_CHECKS: Array<(filters: ItemFilters) => boolean> = [
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

const PRIMARY_ACTIVE_CHECKS: Array<(filters: ItemFilters) => boolean> = [
  (f) => f.search.trim().length > 0,
  (f) => f.statuses.length > 0,
  (f) => f.priorities.length > 0,
  (f) => f.assignees.length > 0,
  (f) => f.due !== "any",
];

export function countAdvancedFilters(filters: ItemFilters) {
  return ADVANCED_ACTIVE_CHECKS.filter((isActive) => isActive(filters)).length;
}

export function countActiveFilters(filters: ItemFilters) {
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
// filter never disagrees with what the user sees on the item.
function inDayRange(value: string | null, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;
  const day = toDateInputValue(value);
  if (!day) return false;
  return (!from || day >= from) && (!to || day <= to);
}

function matchesDuePreset(item: Item, due: DuePreset) {
  if (due === "any") return true;
  if (due === "none") return !item.dueDate;
  if (!item.dueDate) return false;
  const daysUntil = differenceInCalendarDays(new Date(item.dueDate), new Date());
  // A finished item with a past due date isn't late anymore.
  if (due === "overdue") return daysUntil < 0 && item.status !== "DONE";
  if (due === "today") return daysUntil === 0;
  return daysUntil >= 0 && daysUntil <= 7;
}

export function matchesItemFilters(item: Item, filters: ItemFilters) {
  const query = normalizeText(filters.search.trim());
  if (query) {
    const haystack = normalizeText(`${item.title}\n${item.description ?? ""}`);
    if (!haystack.includes(query)) return false;
  }

  if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) return false;

  if (filters.priorities.length > 0) {
    const priority = item.priority ?? NO_PRIORITY_VALUE;
    if (!filters.priorities.includes(priority)) return false;
  }

  if (filters.assignees.length > 0) {
    // Any of the item's assignees counts, not only the main one.
    const ids = item.assigneeIds?.length ? item.assigneeIds : item.assigneeId ? [item.assigneeId] : [];
    const candidates = ids.length > 0 ? ids : [UNASSIGNED_VALUE];
    if (!candidates.some((id) => filters.assignees.includes(id))) return false;
  }

  if (!matchesDuePreset(item, filters.due)) return false;
  if (!inDayRange(item.dueDate, filters.dueFrom, filters.dueTo)) return false;
  if (!inDayRange(item.createdAt, filters.createdFrom, filters.createdTo)) return false;
  if (!inDayRange(item.updatedAt, filters.updatedFrom, filters.updatedTo)) return false;

  if (filters.participantId && !item.participantIds.includes(filters.participantId)) return false;
  if (filters.mentionedId && !item.mentionedUserIds.includes(filters.mentionedId)) return false;
  if (filters.createdBy && item.createdBy !== filters.createdBy) return false;

  if (!matchesTriState(filters.attachments, item.attachments.length > 0)) return false;
  if (!matchesTriState(filters.description, Boolean(item.description?.trim()))) return false;

  if (filters.kind === "items" && item.parentItemId) return false;
  if (filters.kind === "subitems" && !item.parentItemId) return false;

  return true;
}

export function applyItemFilters(items: Item[], filters: ItemFilters) {
  return countActiveFilters(filters) === 0
    ? items
    : items.filter((item) => matchesItemFilters(item, filters));
}
