import type { ItemPriority } from "@/types/item";

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** Always read in `timezone` (IANA). API.md § 27. */
export interface RecurrenceSchedule {
  frequency: RecurrenceFrequency;
  /** Every N days/weeks/months/years (default 1). */
  interval?: number;
  /** WEEKLY: 0 = Sunday … 6 = Saturday. */
  daysOfWeek?: number[];
  /** MONTHLY/YEARLY: 1–31; a shorter month falls on its last day (31 = "end of month"). */
  dayOfMonth?: number | null;
  /** YEARLY: 1–12. */
  month?: number | null;
  /** Local `HH:mm`. */
  time: string;
  timezone?: string;
  /** `YYYY-MM-DD`, defaults to today in the schedule's timezone. */
  startDate?: string;
  /** `YYYY-MM-DD`, inclusive; `null` = no end. */
  endDate?: string | null;
}

export type NormalizedRecurrenceSchedule = Required<Omit<RecurrenceSchedule, "dayOfMonth" | "month" | "endDate">> & {
  dayOfMonth: number | null;
  month: number | null;
  endDate: string | null;
};

export type RecurrenceDisabledReason = "AUTHORITY_LOST" | "FOLDER_INACTIVE";

export interface ItemRecurrence {
  id: string;
  workspaceId: string;
  folderId: string;
  createdBy: string;
  enabled: boolean;
  disabledReason: RecurrenceDisabledReason | null;
  title: string;
  description: string | null;
  sectionId: string | null;
  priority: ItemPriority | null;
  assigneeId: string | null;
  dueInDays: number | null;
  customFieldValues: Record<string, unknown>;
  schedule: NormalizedRecurrenceSchedule;
  nextRunAt: string | null;
  upcomingOccurrences: string[];
  lastRunAt: string | null;
  lastItemId: string | null;
  /** A warning from the last occurrence (the item was still created). */
  lastError: string | null;
  occurrenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRecurrenceRequest {
  title: string;
  description?: string;
  sectionId?: string;
  priority?: ItemPriority;
  assigneeId?: string;
  dueInDays?: number;
  customFieldValues?: Record<string, unknown>;
  schedule: RecurrenceSchedule;
}

/** `null` clears the nullable fields; `schedule` replaces the whole schedule. */
export interface UpdateItemRecurrenceRequest {
  title?: string;
  description?: string | null;
  sectionId?: string | null;
  priority?: ItemPriority | null;
  assigneeId?: string | null;
  dueInDays?: number | null;
  customFieldValues?: Record<string, unknown>;
  schedule?: RecurrenceSchedule;
  enabled?: boolean;
}

export interface RecurrencePreview {
  schedule: NormalizedRecurrenceSchedule;
  upcomingOccurrences: string[];
}
