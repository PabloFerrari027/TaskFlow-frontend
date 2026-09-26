import { apiClient } from "@/lib/api/client";
import type { AnalyticsQuery, AnalyticsResult } from "@/types/analytics";

export async function runAnalyticsQuery(payload: AnalyticsQuery) {
  const { data } = await apiClient.post<AnalyticsResult>("/analytics/query", payload);
  return data;
}
