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

export interface AnalyticsQuery {
  entity: AnalyticsEntity;
  workspaceId: string;
  filters?: AnalyticsFilter[];
  groupBy?: string[];
  metrics: AnalyticsMetric[];
}

export type AnalyticsResultMetric = AnalyticsMetric & { alias: string };

export interface AnalyticsResult {
  entity: AnalyticsEntity;
  groupBy: string[];
  metrics: AnalyticsResultMetric[];
  data: Record<string, string | number>[];
}
