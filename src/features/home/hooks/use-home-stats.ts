"use client";

import { useQuery } from "@tanstack/react-query";
import { runAnalyticsQuery } from "@/features/analytics/api/analytics-service";
import {
  dueSoonQuery,
  openByProjectQuery,
  openQuery,
  overdueByProjectQuery,
  overdueQuery,
  progressQuery,
} from "@/features/home/lib/home-queries";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsQuery } from "@/types/analytics";

// One query per indicator, so each card loads and fails on its own — same
// shape as the project's Estatísticas tab. "Now" is read when the request is
// sent, never at render, so it stays out of the key.
function useHomeStatQuery(
  workspaceId: string | null,
  userId: string | null,
  indicator: string,
  build: (workspaceId: string, userId: string, now: Date) => AnalyticsQuery
) {
  return useQuery({
    queryKey: queryKeys.home.indicator(workspaceId ?? "", userId ?? "", indicator),
    queryFn: () => runAnalyticsQuery(build(workspaceId!, userId!, new Date())),
    enabled: Boolean(workspaceId && userId),
    staleTime: 60_000,
  });
}

export function useHomeStats(workspaceId: string | null, userId: string | null) {
  return {
    progress: useHomeStatQuery(workspaceId, userId, "progress", progressQuery),
    open: useHomeStatQuery(workspaceId, userId, "open", openQuery),
    overdue: useHomeStatQuery(workspaceId, userId, "overdue", overdueQuery),
    dueSoon: useHomeStatQuery(workspaceId, userId, "due-soon", dueSoonQuery),
    openByProject: useHomeStatQuery(workspaceId, userId, "open-by-project", openByProjectQuery),
    overdueByProject: useHomeStatQuery(
      workspaceId,
      userId,
      "overdue-by-project",
      overdueByProjectQuery
    ),
  };
}
