import { apiClient } from "@/lib/api/client";
import type { AnalyticsQueryRequest, AnalyticsResult } from "@/types/analytics";

export const analyticsService = {
  async query(payload: AnalyticsQueryRequest) {
    const { data } = await apiClient.post<AnalyticsResult>("/analytics/query", payload);
    return data;
  },
};
