import type { PaginatedResult } from "@/types/common";

export interface TimeEntry {
  id: string;
  itemId: string;
  folderId: string;
  userId: string;
  startedAt: string;
  /** `null` while the timer is running. */
  endedAt: string | null;
  /** Final duration, or up to now while running. */
  durationSeconds: number;
  running: boolean;
  note: string | null;
}

export interface ItemTimeEntries extends PaginatedResult<TimeEntry> {
  /** Everyone's time on the item. */
  totalSeconds: number;
}

export interface StartTimerResult {
  running: TimeEntry;
  /** The timer that was running on another item, stopped by this start. */
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

export type TimeReportGroupBy = "user" | "item";

export interface TimeReportRow {
  /** userId or itemId, per the grouping. */
  key: string;
  label: string;
  totalSeconds: number;
  entries: number;
  /** Only when grouped by item. */
  estimateMinutes?: number | null;
}

export interface FolderTimeReport {
  folderId: string;
  groupBy: TimeReportGroupBy;
  totalSeconds: number;
  rows: TimeReportRow[];
}
