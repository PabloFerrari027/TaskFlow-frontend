import { formatDurationHours, formatRatio } from "@/lib/format";
import type { AnalyticsDerivedMetricName } from "@/types/analytics";

const RATIO_METRICS = new Set<AnalyticsDerivedMetricName>(["completion_rate", "overdue_rate"]);

export const DERIVED_METRIC_LABEL: Record<AnalyticsDerivedMetricName, string> = {
  completion_rate: "Taxa de conclusão",
  overdue_rate: "Taxa de atraso",
  average_completion_time: "Tempo médio de conclusão",
  // Same formula/value as average_completion_time today (API.md § 12) — kept
  // as its own metric only as a reserved slot for when the backend gains
  // real per-status granularity, not a second meaningful number to compare.
  cycle_time: "Tempo de ciclo (reservado)",
};

// The single formatter for every derived metric value, shared by the fixed
// dashboard charts and the natural-language result renderer — never
// duplicate this per call site.
export function formatDerivedMetricValue(
  name: AnalyticsDerivedMetricName,
  value: number | null
): string {
  if (value === null) return "Sem dados";
  return RATIO_METRICS.has(name) ? formatRatio(value) : formatDurationHours(value);
}
