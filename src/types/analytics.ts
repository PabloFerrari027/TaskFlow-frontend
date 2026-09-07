export type AnalyticsEntity = "tasks" | "projects";

export type AnalyticsOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "in"
  | "between";

export type AnalyticsMetricType = "count" | "sum" | "average";

export interface AnalyticsFilter {
  field: string;
  operator: AnalyticsOperator;
  value: unknown;
}

export interface AnalyticsMetric {
  type: AnalyticsMetricType;
  field: string;
}

export interface AnalyticsQueryRequest {
  entity: AnalyticsEntity;
  workspaceId: string;
  filters?: AnalyticsFilter[];
  groupBy?: string[];
  metrics: AnalyticsMetric[];
}

export interface AnalyticsResultMetric extends AnalyticsMetric {
  alias: string;
}

export interface AnalyticsResult {
  entity: AnalyticsEntity;
  groupBy: string[];
  metrics: AnalyticsResultMetric[];
  data: Record<string, string | number>[];
}
