export type AnalyticsEntity = "tasks" | "projects";

export type AnalyticsOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "in"
  | "between";

export type AnalyticsMetricType = "count" | "sum" | "average";

export type AnalyticsDerivedMetricName =
  | "completion_rate"
  | "overdue_rate"
  | "average_completion_time"
  | "cycle_time";

export interface AnalyticsFilter {
  field: string;
  operator: AnalyticsOperator;
  value: unknown;
}

export interface AnalyticsCountMetric {
  type: AnalyticsMetricType;
  field: string;
}

export interface AnalyticsDerivedMetric {
  type: "derived";
  name: AnalyticsDerivedMetricName;
}

export type AnalyticsMetric = AnalyticsCountMetric | AnalyticsDerivedMetric;

export interface AnalyticsSort {
  field: string;
  direction: "asc" | "desc";
}

export interface AnalyticsQuery {
  entity: AnalyticsEntity;
  workspaceId: string;
  filters?: AnalyticsFilter[];
  groupBy?: string[];
  metrics: AnalyticsMetric[];
  sort?: AnalyticsSort[];
}

export type AnalyticsResultMetric = AnalyticsMetric & { alias: string };

export interface AnalyticsResult {
  entity: AnalyticsEntity;
  groupBy: string[];
  metrics: AnalyticsResultMetric[];
  // A derived metric (completion_rate, overdue_rate, average_completion_time,
  // cycle_time) can be null for a group with insufficient data.
  data: Record<string, string | number | null>[];
}

// Response of POST /analytics/query/natural-language — `query` is the
// AnalyticsQuery the AI derived from the question, returned alongside
// `result` so the UI can show what it understood, never just the numbers.
export interface NaturalLanguageQueryResponse {
  query: AnalyticsQuery;
  result: AnalyticsResult;
}
