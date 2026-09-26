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
