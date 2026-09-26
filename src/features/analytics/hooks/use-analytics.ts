"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { runAnalyticsQuery } from "@/features/analytics/api/analytics-service";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsQuery } from "@/types/analytics";

// `workspaceId` is always revalidated by the API against the caller's own
// role in that workspace (API.md § 12), so this never needs a separate
// permission check on the frontend. Backs the live preview of the
// dashboard-page chart builder (pass `workspaceId: null` to pause it while
// the query is still incomplete).
export function useAnalyticsQuery(
  workspaceId: string | null,
  request: Omit<AnalyticsQuery, "workspaceId">,
  options?: {
    // Keep showing the last result while the next one loads, instead of
    // flashing a skeleton on every edit (the builder's preview).
    keepPreviousResult?: boolean;
    // A builder mistake (INVALID_ANALYTICS_QUERY) won't fix itself on retry.
    retry?: boolean;
  }
) {
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
    placeholderData: options?.keepPreviousResult ? keepPreviousData : undefined,
    // Only set when asked: an explicit `undefined` would shadow the
    // QueryProvider's default retry policy.
    ...(options?.retry !== undefined ? { retry: options.retry } : {}),
  });
}
