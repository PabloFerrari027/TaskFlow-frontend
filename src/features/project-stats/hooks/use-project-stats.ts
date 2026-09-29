"use client";

import { useQuery } from "@tanstack/react-query";
import { runAnalyticsQuery } from "@/features/analytics/api/analytics-service";
import {
  byAssigneeQuery,
  byPriorityQuery,
  byStatusQuery,
  createdOverTimeQuery,
  ensureTotalsRow,
  fillEmptyWeeks,
  openTasksQuery,
  summaryQuery,
  urgentOpenQuery,
} from "@/features/project-stats/lib/project-stats-queries";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsResult } from "@/types/analytics";

// One query per indicator, so each card/chart loads and fails on its own.
// "Now" is read when the request is sent, not at render: the key names the
// indicator, and a refetch always looks at the current weeks.
function useProjectStatQuery(
  projectId: string,
  indicator: string,
  fetch: (now: Date) => Promise<AnalyticsResult>
) {
  return useQuery({
    queryKey: queryKeys.projectStats.indicator(projectId, indicator),
    queryFn: () => fetch(new Date()),
    // Same as the other analytics reads: aggregates ride a bit longer than
    // entity reads, and task changes invalidate them anyway.
    staleTime: 60_000,
  });
}

export function useProjectStats(projectId: string, workspaceId: string) {
  const summary = useProjectStatQuery(projectId, "summary", () =>
    runAnalyticsQuery(summaryQuery(projectId, workspaceId)).then(ensureTotalsRow)
  );
  const open = useProjectStatQuery(projectId, "open", () =>
    runAnalyticsQuery(openTasksQuery(projectId, workspaceId)).then(ensureTotalsRow)
  );
  const urgentOpen = useProjectStatQuery(projectId, "urgent-open", () =>
    runAnalyticsQuery(urgentOpenQuery(projectId, workspaceId)).then(ensureTotalsRow)
  );
  const byStatus = useProjectStatQuery(projectId, "by-status", () =>
    runAnalyticsQuery(byStatusQuery(projectId, workspaceId))
  );
  const byPriority = useProjectStatQuery(projectId, "by-priority", () =>
    runAnalyticsQuery(byPriorityQuery(projectId, workspaceId))
  );
  const createdOverTime = useProjectStatQuery(projectId, "created-over-time", (now) =>
    runAnalyticsQuery(createdOverTimeQuery(projectId, workspaceId, now)).then((result) =>
      fillEmptyWeeks(result, now)
    )
  );
  const byAssignee = useProjectStatQuery(projectId, "by-assignee", () =>
    runAnalyticsQuery(byAssigneeQuery(projectId, workspaceId))
  );

  return { summary, open, urgentOpen, byStatus, byPriority, createdOverTime, byAssignee };
}
