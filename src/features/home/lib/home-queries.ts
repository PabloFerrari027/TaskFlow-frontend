import type { AnalyticsFilter, AnalyticsQuery, AnalyticsResult } from "@/types/analytics";

/**
 * The Início page's numbers: items assigned to the signed-in user in the
 * current workspace. There is no "my items" endpoint, so everything is an
 * analytics count filtered by `assigneeId` (API.md § 12) — participants and
 * mentions don't count, only the main assignee. Builders that filter by date
 * take "now" as a parameter so they stay pure.
 */

export const DUE_SOON_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const NOT_DONE: AnalyticsFilter = { field: "status", operator: "notEquals", value: "DONE" };

function mine(userId: string, filters: AnalyticsFilter[] = []): AnalyticsFilter[] {
  return [{ field: "assigneeId", operator: "equals", value: userId }, ...filters];
}

function overdue(now: Date): AnalyticsFilter {
  return { field: "dueDate", operator: "lessThan", value: now.toISOString() };
}

function count(
  workspaceId: string,
  filters: AnalyticsFilter[],
  groupBy: string[] = []
): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters,
    groupBy,
    metrics: [{ type: "count", field: "id" }],
  };
}

/** Everything ever assigned to me, and how much of it is done. */
export function progressQuery(workspaceId: string, userId: string): AnalyticsQuery {
  return {
    entity: "items",
    workspaceId,
    filters: mine(userId),
    metrics: [
      { type: "count", field: "id" },
      { type: "derived", name: "completion_rate" },
    ],
  };
}

export function openQuery(workspaceId: string, userId: string): AnalyticsQuery {
  return count(workspaceId, mine(userId, [NOT_DONE]));
}

export function overdueQuery(workspaceId: string, userId: string, now: Date): AnalyticsQuery {
  return count(workspaceId, mine(userId, [NOT_DONE, overdue(now)]));
}

export function dueSoonQuery(workspaceId: string, userId: string, now: Date): AnalyticsQuery {
  const until = new Date(now.getTime() + DUE_SOON_DAYS * DAY_MS);
  return count(
    workspaceId,
    mine(userId, [
      NOT_DONE,
      { field: "dueDate", operator: "between", value: [now.toISOString(), until.toISOString()] },
    ])
  );
}

/** One row per root folder (the backend rolls sub-folders up). */
export function openByFolderQuery(workspaceId: string, userId: string): AnalyticsQuery {
  return count(workspaceId, mine(userId, [NOT_DONE]), ["folderId"]);
}

export function overdueByFolderQuery(
  workspaceId: string,
  userId: string,
  now: Date
): AnalyticsQuery {
  return count(workspaceId, mine(userId, [NOT_DONE, overdue(now)]), ["folderId"]);
}

/** The value of the result's first metric in its only row; 0 when no item matched. */
export function readCount(result: AnalyticsResult | undefined): number {
  const alias = result?.metrics[0]?.alias;
  const value = alias ? result?.data[0]?.[alias] : undefined;
  return typeof value === "number" ? value : 0;
}

/** A derived metric read by name, or null when the backend has no data for it. */
export function readDerived(result: AnalyticsResult | undefined, name: string): number | null {
  const metric = result?.metrics.find((m) => m.type === "derived" && "name" in m && m.name === name);
  const value = metric ? result?.data[0]?.[metric.alias] : undefined;
  return typeof value === "number" ? value : null;
}

/** `folderId → count` out of a result grouped by folder. */
export function countsByFolder(result: AnalyticsResult | undefined): Map<string, number> {
  const alias = result?.metrics[0]?.alias;
  const counts = new Map<string, number>();
  if (!result || !alias) return counts;
  for (const row of result.data) {
    const value = row[alias];
    if (typeof row.folderId === "string" && typeof value === "number") {
      counts.set(row.folderId, value);
    }
  }
  return counts;
}
