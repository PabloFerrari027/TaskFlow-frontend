import type { PaginatedResult } from "@/types/common";

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  startedAt: string;
  /** `null` while the timer is running. */
  endedAt: string | null;
  /** Final duration, or up to now while running. */
  durationSeconds: number;
  running: boolean;
  note: string | null;
}

export interface TaskTimeEntries extends PaginatedResult<TimeEntry> {
  /** Everyone's time on the task. */
  totalSeconds: number;
}

export interface StartTimerResult {
  running: TimeEntry;
  /** The timer that was running on another task, stopped by this start. */
  stopped: TimeEntry | null;
}

export interface LogTimeEntryRequest {
  startedAt: string;
  /** 1–1440. */
  durationMinutes: number;
  note?: string;
}

export interface UpdateTimeEntryRequest {
  startedAt?: string;
  durationMinutes?: number;
  note?: string | null;
}

export type TimeReportGroupBy = "user" | "task";

export interface TimeReportRow {
  /** userId or taskId, per the grouping. */
  key: string;
  label: string;
  totalSeconds: number;
  entries: number;
  /** Only when grouped by task. */
  estimateMinutes?: number | null;
}

export interface ProjectTimeReport {
  projectId: string;
  groupBy: TimeReportGroupBy;
  totalSeconds: number;
  rows: TimeReportRow[];
}
