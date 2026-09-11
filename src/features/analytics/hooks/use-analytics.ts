"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { runAnalyticsQuery } from "@/features/analytics/api/analytics-service";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsFilter, AnalyticsQuery } from "@/types/analytics";
import type { ProjectStatus } from "@/types/project";
import type { TaskStatus } from "@/types/task";

// Shared by every chart below — `workspaceId` is always revalidated by the
// API against the caller's own role in that workspace (API.md § 12), so this
// never needs a separate permission check on the frontend.
function useAnalyticsQuery(workspaceId: string | null, request: Omit<AnalyticsQuery, "workspaceId">) {
  const fullRequest: AnalyticsQuery | null = workspaceId
    ? { ...request, workspaceId }
    : null;

  return useQuery({
    queryKey: fullRequest ? queryKeys.analytics.query(fullRequest) : ["analytics", "disabled"],
    queryFn: () => runAnalyticsQuery(fullRequest as AnalyticsQuery),
    enabled: Boolean(fullRequest),
    // Aggregated data changes less often than a single entity read — ride
    // longer before treating the cache as stale (default is 30s).
    staleTime: 60_000,
  });
}

function projectFilter(projectId?: string): AnalyticsFilter[] {
  return projectId ? [{ field: "projectId", operator: "equals", value: projectId }] : [];
}

// Total task count, optionally scoped to one project — feeds a stat tile.
export function useTotalTasksCountQuery(workspaceId: string | null, projectId?: string) {
  const query = useAnalyticsQuery(workspaceId, {
    entity: "tasks",
    filters: projectFilter(projectId),
    metrics: [{ type: "count", field: "id" }],
  });
  const count = query.data?.data[0]?.count;
  return { ...query, count: typeof count === "number" ? count : 0 };
}

// Completed task count, optionally scoped to one project — feeds a stat tile.
export function useCompletedTaskCountQuery(workspaceId: string | null, projectId?: string) {
  const query = useAnalyticsQuery(workspaceId, {
    entity: "tasks",
    filters: [...projectFilter(projectId), { field: "status", operator: "equals", value: "DONE" }],
    metrics: [{ type: "count", field: "id" }],
  });
  const count = query.data?.data[0]?.count;
  return { ...query, count: typeof count === "number" ? count : 0 };
}

export interface StatusCount {
  status: TaskStatus;
  count: number;
}

// Tasks grouped by status, optionally scoped to one project — feeds the
// "Tarefas por status" chart.
export function useTasksByStatusQuery(workspaceId: string | null, projectId?: string) {
  const query = useAnalyticsQuery(workspaceId, {
    entity: "tasks",
    filters: projectFilter(projectId),
    groupBy: ["status"],
    metrics: [{ type: "count", field: "id" }],
  });

  const rows: StatusCount[] = (query.data?.data ?? []).map((row) => ({
    status: row.status as TaskStatus,
    count: typeof row.count === "number" ? row.count : 0,
  }));

  return { ...query, rows };
}

export interface ProjectCount {
  projectId: string;
  count: number;
}

// Tasks grouped by project, workspace-wide — feeds the "Tarefas por projeto"
// chart, which exists specifically to compare across projects, so it's never
// scoped down to a single one.
export function useTasksByProjectQuery(workspaceId: string | null) {
  const query = useAnalyticsQuery(workspaceId, {
    entity: "tasks",
    groupBy: ["projectId"],
    metrics: [{ type: "count", field: "id" }],
  });

  const rows: ProjectCount[] = (query.data?.data ?? []).map((row) => ({
    projectId: row.projectId as string,
    count: typeof row.count === "number" ? row.count : 0,
  }));

  return { ...query, rows };
}

export interface AssigneeCount {
  assigneeId: string | null;
  count: number;
}

// Tasks grouped by assignee, optionally scoped to one project — feeds the
// "Tarefas por responsável" chart. Unassigned tasks come back grouped under
// a `null` assigneeId.
export function useTasksByAssigneeQuery(workspaceId: string | null, projectId?: string) {
  const query = useAnalyticsQuery(workspaceId, {
    entity: "tasks",
    filters: projectFilter(projectId),
    groupBy: ["assigneeId"],
    metrics: [{ type: "count", field: "id" }],
  });

  const rows: AssigneeCount[] = (query.data?.data ?? []).map((row) => ({
    assigneeId: (row.assigneeId as string | null) ?? null,
    count: typeof row.count === "number" ? row.count : 0,
  }));

  return { ...query, rows };
}

export interface OverdueProjectCount {
  projectId: string;
  count: number;
}

// Overdue tasks (dueDate before "now") grouped by project, workspace-wide —
// feeds the "Tarefas atrasadas por projeto" chart (the worked example in
// API.md § 12). The cutoff is memoized per mount so the query key stays
// stable across re-renders instead of drifting (and refetching) every tick.
export function useOverdueTasksByProjectQuery(workspaceId: string | null) {
  const cutoff = useMemo(() => new Date().toISOString(), []);

  const query = useAnalyticsQuery(workspaceId, {
    entity: "tasks",
    filters: [{ field: "dueDate", operator: "lessThan", value: cutoff }],
    groupBy: ["projectId"],
    metrics: [{ type: "count", field: "id" }],
  });

  const rows: OverdueProjectCount[] = (query.data?.data ?? []).map((row) => ({
    projectId: row.projectId as string,
    count: typeof row.count === "number" ? row.count : 0,
  }));

  return { ...query, rows };
}

export interface ProjectStatusCount {
  status: ProjectStatus;
  count: number;
}

// Projects grouped by status, workspace-wide — feeds the "Projetos por
// status" chart, which (like "Tarefas por projeto") compares across
// projects, so it's never scoped down to a single one either.
export function useProjectsByStatusQuery(workspaceId: string | null) {
  const query = useAnalyticsQuery(workspaceId, {
    entity: "projects",
    groupBy: ["status"],
    metrics: [{ type: "count", field: "id" }],
  });

  const rows: ProjectStatusCount[] = (query.data?.data ?? []).map((row) => ({
    status: row.status as ProjectStatus,
    count: typeof row.count === "number" ? row.count : 0,
  }));

  return { ...query, rows };
}
