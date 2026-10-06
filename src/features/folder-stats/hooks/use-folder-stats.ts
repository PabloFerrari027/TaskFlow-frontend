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
  openItemsQuery,
  summaryQuery,
  urgentOpenQuery,
} from "@/features/folder-stats/lib/folder-stats-queries";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsResult } from "@/types/analytics";

// One query per indicator, so each card/chart loads and fails on its own.
// "Now" is read when the request is sent, not at render: the key names the
// indicator, and a refetch always looks at the current weeks.
function useFolderStatQuery(
  folderId: string,
  indicator: string,
  fetch: (now: Date) => Promise<AnalyticsResult>
) {
  return useQuery({
    queryKey: queryKeys.folderStats.indicator(folderId, indicator),
    queryFn: () => fetch(new Date()),
    // Same as the other analytics reads: aggregates ride a bit longer than
    // entity reads, and item changes invalidate them anyway.
    staleTime: 60_000,
  });
}

export function useFolderStats(folderId: string, workspaceId: string) {
  const summary = useFolderStatQuery(folderId, "summary", () =>
    runAnalyticsQuery(summaryQuery(folderId, workspaceId)).then(ensureTotalsRow)
  );
  const open = useFolderStatQuery(folderId, "open", () =>
    runAnalyticsQuery(openItemsQuery(folderId, workspaceId)).then(ensureTotalsRow)
  );
  const urgentOpen = useFolderStatQuery(folderId, "urgent-open", () =>
    runAnalyticsQuery(urgentOpenQuery(folderId, workspaceId)).then(ensureTotalsRow)
  );
  const byStatus = useFolderStatQuery(folderId, "by-status", () =>
    runAnalyticsQuery(byStatusQuery(folderId, workspaceId))
  );
  const byPriority = useFolderStatQuery(folderId, "by-priority", () =>
    runAnalyticsQuery(byPriorityQuery(folderId, workspaceId))
  );
  const createdOverTime = useFolderStatQuery(folderId, "created-over-time", (now) =>
    runAnalyticsQuery(createdOverTimeQuery(folderId, workspaceId, now)).then((result) =>
      fillEmptyWeeks(result, now)
    )
  );
  const byAssignee = useFolderStatQuery(folderId, "by-assignee", () =>
    runAnalyticsQuery(byAssigneeQuery(folderId, workspaceId))
  );

  return { summary, open, urgentOpen, byStatus, byPriority, createdOverTime, byAssignee };
}
