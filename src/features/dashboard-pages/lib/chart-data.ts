import {
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/components/shared/status-badge";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import {
  groupValueLabel,
  metricLabel,
  parseGroupByEntry,
} from "@/features/dashboard-pages/lib/chart-catalog";
import type { AnalyticsResult, AnalyticsResultMetric } from "@/types/analytics";

// The app's CVD-validated categorical palette (globals.css), in fixed order.
// Past the sixth slot there is no seventh hue — the rest folds into "Outros".
export const MAX_CATEGORY_COLORS = 6;
export const OTHER_COLOR = "var(--muted-foreground)";

export function categoryColor(index: number) {
  return index < MAX_CATEGORY_COLORS ? `var(--analytics-cat-${index + 1})` : OTHER_COLOR;
}

export interface ChartSeries {
  alias: string;
  label: string;
  color: string;
  metric: AnalyticsResultMetric;
}

// One point/bar/slice: `key` is the raw group value, `label` its text, and
// every metric alias maps to that group's value.
export interface ChartRow {
  key: string;
  label: string;
  values: Record<string, number | null>;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function buildSeries(result: AnalyticsResult): ChartSeries[] {
  return result.metrics.map((metric, index) => ({
    alias: metric.alias,
    label: metricLabel(metric),
    color: categoryColor(index),
    metric,
  }));
}

export function isTemporalResult(result: AnalyticsResult) {
  const entry = result.groupBy[0];
  return Boolean(entry && parseGroupByEntry(entry).unit);
}

// Status/priority values keep the order people already know from the board
// (and their colour follows the value, not its rank in this particular
// result); everything else is ranked by the first metric, largest first.
const ENUM_ORDER: Record<string, string[]> = {
  "tasks:status": Object.keys(TASK_STATUS_LABEL),
  "tasks:priority": Object.keys(TASK_PRIORITY_LABEL),
  "projects:status": Object.keys(PROJECT_STATUS_LABEL),
};

export function enumOrderFor(result: AnalyticsResult): string[] | undefined {
  const entry = result.groupBy[0];
  return entry ? ENUM_ORDER[`${result.entity}:${entry}`] : undefined;
}

export function buildRows(result: AnalyticsResult, lookups?: ValueLabeler): ChartRow[] {
  const entry = result.groupBy[0];
  const rows: ChartRow[] = result.data.map((datum) => {
    const raw = entry ? datum[entry] : null;
    const values: Record<string, number | null> = {};
    for (const metric of result.metrics) values[metric.alias] = toNumber(datum[metric.alias]);
    return {
      key: raw === null || raw === undefined ? "__none" : String(raw),
      label: entry ? groupValueLabel(result.entity, entry, raw, lookups) : "",
      values,
    };
  });

  if (!entry) return rows;

  if (isTemporalResult(result)) {
    return rows.sort((a, b) => new Date(a.key).getTime() - new Date(b.key).getTime());
  }

  const order = enumOrderFor(result);
  if (order) {
    const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
    return rows.sort((a, b) => rank(a.key) - rank(b.key));
  }

  const first = result.metrics[0]?.alias;
  return rows.sort((a, b) => (b.values[first] ?? -Infinity) - (a.values[first] ?? -Infinity));
}

/** Recharts wants flat objects: `{ key, label, <alias>: value, … }`. */
export function flattenRows(rows: ChartRow[]) {
  return rows.map((row) => ({ key: row.key, label: row.label, ...row.values }));
}
