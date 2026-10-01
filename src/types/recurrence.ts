import type { TaskPriority } from "@/types/task";

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

export type RecurrenceDisabledReason = "AUTHORITY_LOST" | "PROJECT_INACTIVE";

export interface TaskRecurrence {
  id: string;
  workspaceId: string;
  projectId: string;
  createdBy: string;
  enabled: boolean;
  disabledReason: RecurrenceDisabledReason | null;
  title: string;
  description: string | null;
  sectionId: string | null;
  priority: TaskPriority | null;
  assigneeId: string | null;
  dueInDays: number | null;
  customFieldValues: Record<string, unknown>;
  schedule: NormalizedRecurrenceSchedule;
  nextRunAt: string | null;
  upcomingOccurrences: string[];
  lastRunAt: string | null;
  lastTaskId: string | null;
  /** A warning from the last occurrence (the task was still created). */
  lastError: string | null;
  occurrenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRecurrenceRequest {
  title: string;
  description?: string;
  sectionId?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueInDays?: number;
  customFieldValues?: Record<string, unknown>;
  schedule: RecurrenceSchedule;
}

/** `null` clears the nullable fields; `schedule` replaces the whole schedule. */
export interface UpdateTaskRecurrenceRequest {
  title?: string;
  description?: string | null;
  sectionId?: string | null;
  priority?: TaskPriority | null;
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
