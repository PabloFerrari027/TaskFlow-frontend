import { metricKey } from "@/features/dashboard-pages/lib/chart-catalog";
import type { AnalyticsFilter, AnalyticsQuery, AnalyticsResult } from "@/types/analytics";

/**
 * One pure query builder per indicator of the folder's Estatísticas tab.
 * The `folderId` filter rolls sub-folders up on the backend (API.md § 12),
 * so every number here already includes them. Builders that filter by date
 * take "now" as a parameter so they stay pure (and testable).
 */

export const CREATED_OVER_TIME_WEEKS = 12;

function itemsOf(folderId: string, filters: AnalyticsFilter[] = []): AnalyticsFilter[] {
  return [{ field: "folderId", operator: "equals", value: folderId }, ...filters];
}

const NOT_DONE: AnalyticsFilter = { field: "status", operator: "notEquals", value: "DONE" };

/** Total, completion rate, overdue rate and average completion time — four cards, one request. */
export function summaryQuery(folderId: string, workspaceId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId),
    metrics: [
      { type: "count", field: "id" },
      { type: "derived", name: "completion_rate" },
      { type: "derived", name: "overdue_rate" },
      { type: "derived", name: "average_completion_time" },
    ],
  };
}

export function openItemsQuery(folderId: string, workspaceId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId, [NOT_DONE]),
    metrics: [{ type: "count", field: "id" }],
  };
}

export function urgentOpenQuery(folderId: string, workspaceId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId, [
      { field: "priority", operator: "equals", value: "URGENT" },
      NOT_DONE,
    ]),
    metrics: [{ type: "count", field: "id" }],
  };
}

export function byStatusQuery(folderId: string, workspaceId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId),
    groupBy: ["status"],
    metrics: [{ type: "count", field: "id" }],
  };
}

export function byPriorityQuery(folderId: string, workspaceId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId),
    groupBy: ["priority"],
    metrics: [{ type: "count", field: "id" }],
  };
}

export function byAssigneeQuery(folderId: string, workspaceId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId),
    groupBy: ["assigneeId"],
    metrics: [{ type: "count", field: "id" }],
  };
}

const CREATED_WEEK = "createdAt:week";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Start (Monday 00:00 UTC — what the backend's `date_trunc('week')` returns)
 * of each of the last `CREATED_OVER_TIME_WEEKS` weeks, oldest first, the
 * current week included.
 */
export function lastWeekStarts(now: Date): Date[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const sinceMonday = (new Date(today).getUTCDay() + 6) % 7;
  const currentWeek = today - sinceMonday * 24 * 60 * 60 * 1000;
  return Array.from(
    { length: CREATED_OVER_TIME_WEEKS },
    (_, index) => new Date(currentWeek - (CREATED_OVER_TIME_WEEKS - 1 - index) * WEEK_MS)
  );
}

export function createdOverTimeQuery(
  folderId: string,
  workspaceId: string,
  now: Date
): AnalyticsQuery {
  // `greaterThan` is strict: one millisecond earlier keeps an item created
  // exactly at the first bucket's midnight.
  const since = new Date(lastWeekStarts(now)[0].getTime() - 1);
  return {
    entity: "items",
    workspaceId,
    filters: itemsOf(folderId, [
      { field: "createdAt", operator: "greaterThan", value: since.toISOString() },
    ]),
    groupBy: [CREATED_WEEK],
    sort: [{ field: CREATED_WEEK, direction: "asc" }],
    metrics: [{ type: "count", field: "id" }],
  };
}

/**
 * The backend only returns weeks that have items; a line jumping over an
 * empty week would hide it. Fill every week of the window, with 0 where
 * nothing was created.
 */
export function fillEmptyWeeks(result: AnalyticsResult, now: Date): AnalyticsResult {
  const alias = result.metrics[0]?.alias;
  if (!alias) return result;
  const byWeek = new Map(
    result.data.map((row) => [new Date(String(row[CREATED_WEEK])).getTime(), row[alias]])
  );
  return {
    ...result,
    data: lastWeekStarts(now).map((week) => ({
      [CREATED_WEEK]: week.toISOString(),
      [alias]: byWeek.get(week.getTime()) ?? 0,
    })),
  };
}

/**
 * A count with no grouping is one row; if the backend answers with none (no
 * item matched), that row is a 0 — never "Sem dados".
 */
export function ensureTotalsRow(result: AnalyticsResult): AnalyticsResult {
  if (result.groupBy.length > 0 || result.data.length > 0) return result;
  return {
    ...result,
    data: [Object.fromEntries(result.metrics.map((metric) => [metric.alias, 0]))],
  };
}

/**
 * Cuts one metric out of a multi-metric result, as if it had been asked on
 * its own. Matched by what the metric is (`count`, `completion_rate`…) and
 * read under the alias the response itself declares — never a guessed one.
 */
export function pickMetric(result: AnalyticsResult, key: string): AnalyticsResult | null {
  const metric = result.metrics.find((m) => metricKey(m) === key);
  if (!metric) return null;
  return {
    ...result,
    metrics: [metric],
    data: result.data.map((row) => ({
      ...Object.fromEntries(result.groupBy.map((entry) => [entry, row[entry]])),
      [metric.alias]: row[metric.alias] ?? null,
    })),
  };
}
