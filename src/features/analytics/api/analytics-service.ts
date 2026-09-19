import { apiClient } from "@/lib/api/client";
import type {
  AnalyticsQuery,
  AnalyticsResult,
  NaturalLanguageQueryResponse,
} from "@/types/analytics";

export async function runAnalyticsQuery(payload: AnalyticsQuery) {
  const { data } = await apiClient.post<AnalyticsResult>("/analytics/query", payload);
  return data;
}

export async function runNaturalLanguageQuery(text: string, workspaceId: string) {
  const { data } = await apiClient.post<NaturalLanguageQueryResponse>(
    "/analytics/query/natural-language",
    { text, workspaceId }
  );
  return data;
}
