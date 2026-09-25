import {
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/components/shared/status-badge";
import type { FieldKind, PayloadFieldSpec } from "@/features/automations/lib/automation-catalog";
import {
  conditionValueForRequest,
  isConditionComplete,
  nextConditionKey,
  type ConditionDraft,
  type ValueLabeler,
} from "@/features/automations/lib/automation-draft";
import {
  DERIVED_METRIC_LABEL,
  formatDerivedMetricValue,
} from "@/features/analytics/lib/derived-metrics";
import { formatDate, shortenId } from "@/lib/format";
import type {
  AnalyticsDerivedMetricName,
  AnalyticsEntity,
  AnalyticsMetric,
  AnalyticsResultMetric,
} from "@/types/analytics";
import type {
  ChartDefinition,
  ChartPosition,
  ChartQuery,
  DashboardChartType,
} from "@/types/dashboard-page";

/**
 * Frontend copy of what the backend accepts for a dashboard chart — the
 * analytics whitelist (analytics-query-whitelist.ts) plus the per-chart-type
 * shape rules (chart-definition.entity.ts). There is no endpoint listing
 * either; the backend re-validates every save, so a stale entry here fails
 * loudly (INVALID_CHART_DEFINITION / INVALID_ANALYTICS_QUERY), never silently.
 */

// ------------------------------------------------------------ chart types

export type ChartGrouping = "none" | "categorical" | "temporal" | "any";

export interface ChartTypeSpec {
  type: DashboardChartType;
  label: string;
  hint: string;
  grouping: ChartGrouping;
  multiMetric: boolean;
  // A pie of rates or durations adds up to nothing meaningful — only counts
  // split into slices.
  countOnly: boolean;
  defaultSize: Pick<ChartPosition, "width" | "height">;
}

export const CHART_TYPE_SPECS: ChartTypeSpec[] = [
  {
    type: "BAR",
    label: "Barras",
    hint: "Compare valores entre categorias ou períodos.",
    grouping: "any",
    multiMetric: true,
    countOnly: false,
    defaultSize: { width: 6, height: 4 },
  },
  {
    type: "PIE",
    label: "Pizza",
    hint: "Mostre como um total se divide em partes.",
    grouping: "categorical",
    multiMetric: false,
    countOnly: true,
    defaultSize: { width: 6, height: 4 },
  },
  {
    type: "LINE",
    label: "Linha",
    hint: "Acompanhe como algo muda ao longo do tempo.",
    grouping: "temporal",
    multiMetric: true,
    countOnly: false,
    defaultSize: { width: 12, height: 4 },
  },
  {
    type: "NUMBER",
    label: "Número",
    hint: "Destaque um único valor, em grande.",
    grouping: "none",
    multiMetric: false,
    countOnly: false,
    defaultSize: { width: 3, height: 2 },
  },
];

export function chartTypeSpec(type: DashboardChartType): ChartTypeSpec {
  return CHART_TYPE_SPECS.find((spec) => spec.type === type) ?? CHART_TYPE_SPECS[0];
}

// ---------------------------------------------------------------- entities

export const ENTITY_OPTIONS: { value: AnalyticsEntity; label: string; plural: string }[] = [
  { value: "tasks", label: "Tarefas", plural: "tarefas" },
  { value: "projects", label: "Projetos", plural: "projetos" },
];

function entityPlural(entity: AnalyticsEntity) {
  return ENTITY_OPTIONS.find((option) => option.value === entity)?.plural ?? entity;
}

// ----------------------------------------------------------------- metrics

// Metrics in one chart must share a unit: a count next to a percentage on
// the same axis would be a hidden second scale.
export type MetricUnit = "count" | "ratio" | "duration";

export interface MetricOption {
  key: string;
  label: string;
  metric: AnalyticsMetric;
  unit: MetricUnit;
  entities: AnalyticsEntity[];
}

function derived(name: AnalyticsDerivedMetricName, unit: MetricUnit): MetricOption {
  return {
    key: name,
    label: DERIVED_METRIC_LABEL[name],
    metric: { type: "derived", name },
    unit,
    // Derived metrics are task formulas — the backend rejects them for projects.
    entities: ["tasks"],
  };
}

// sum/average are left out on purpose: no whitelisted field is numeric yet,
// so the backend rejects every one of them (see NUMERIC_FIELDS).
export const METRIC_OPTIONS: MetricOption[] = [
  {
    key: "count",
    label: "Quantidade",
    metric: { type: "count", field: "id" },
    unit: "count",
    entities: ["tasks", "projects"],
  },
  derived("completion_rate", "ratio"),
  derived("overdue_rate", "ratio"),
  derived("average_completion_time", "duration"),
  derived("cycle_time", "duration"),
];

export function metricKey(metric: Pick<AnalyticsMetric, "type"> & { field?: string; name?: string }) {
  if (metric.type === "derived") return metric.name ?? "";
  return metric.type === "count" && metric.field === "id" ? "count" : `${metric.type}_${metric.field}`;
}

function findMetricOption(key: string) {
  return METRIC_OPTIONS.find((option) => option.key === key);
}

export function metricLabel(metric: AnalyticsResultMetric) {
  return findMetricOption(metricKey(metric))?.label ?? metric.alias;
}

const integerFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatMetricValue(metric: AnalyticsMetric, value: number | null): string {
  if (metric.type === "derived") return formatDerivedMetricValue(metric.name, value);
  return value === null ? "Sem dados" : integerFormatter.format(value);
}

// ---------------------------------------------------------------- grouping

export interface GroupFieldSpec {
  field: string;
  label: string;
  kind: FieldKind;
}

export const CATEGORICAL_FIELDS: Record<AnalyticsEntity, GroupFieldSpec[]> = {
  tasks: [
    { field: "status", label: "Status", kind: "taskStatus" },
    { field: "priority", label: "Prioridade", kind: "taskPriority" },
    { field: "assigneeId", label: "Responsável", kind: "member" },
    { field: "projectId", label: "Projeto", kind: "project" },
    { field: "sectionId", label: "Coluna", kind: "section" },
    { field: "createdBy", label: "Quem criou", kind: "member" },
  ],
  projects: [
    { field: "status", label: "Status", kind: "projectStatus" },
    { field: "createdBy", label: "Quem criou", kind: "member" },
  ],
};

export const TEMPORAL_FIELDS: Record<AnalyticsEntity, GroupFieldSpec[]> = {
  tasks: [
    { field: "createdAt", label: "Data de criação", kind: "date" },
    { field: "updatedAt", label: "Última atualização", kind: "date" },
    { field: "dueDate", label: "Prazo", kind: "date" },
  ],
  projects: [{ field: "createdAt", label: "Data de criação", kind: "date" }],
};

export type TemporalUnit = "day" | "week" | "month";

export const TEMPORAL_UNIT_OPTIONS: { value: TemporalUnit; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

// `"createdAt:week"` → temporal; `"status"` → categorical. Same convention as
// the backend's parseGroupByEntry.
export function parseGroupByEntry(entry: string): { field: string; unit?: TemporalUnit } {
  const index = entry.indexOf(":");
  if (index === -1) return { field: entry };
  return { field: entry.slice(0, index), unit: entry.slice(index + 1) as TemporalUnit };
}

export function groupFieldsFor(entity: AnalyticsEntity, grouping: ChartGrouping): GroupFieldSpec[] {
  switch (grouping) {
    case "categorical":
      return CATEGORICAL_FIELDS[entity];
    case "temporal":
      return TEMPORAL_FIELDS[entity];
    case "any":
      return [...CATEGORICAL_FIELDS[entity], ...TEMPORAL_FIELDS[entity]];
    default:
      return [];
  }
}

function isTemporalField(entity: AnalyticsEntity, field: string) {
  return TEMPORAL_FIELDS[entity].some((spec) => spec.field === field);
}

// ----------------------------------------------------------------- filters

// Dates are left out: the shared condition picker only offers
// equals / not equals / one of, which never make sense for a timestamp.
export const FILTER_FIELDS: Record<AnalyticsEntity, PayloadFieldSpec[]> = {
  tasks: [
    { field: "status", label: "status", article: "o", kind: "taskStatus" },
    { field: "priority", label: "prioridade", article: "a", kind: "taskPriority" },
    { field: "assigneeId", label: "responsável", article: "o", kind: "member" },
    { field: "projectId", label: "projeto", article: "o", kind: "project" },
    { field: "sectionId", label: "coluna", article: "a", kind: "section" },
    { field: "createdBy", label: "criador", article: "o", kind: "member" },
  ],
  projects: [
    { field: "status", label: "status", article: "o", kind: "projectStatus" },
    { field: "createdBy", label: "criador", article: "o", kind: "member" },
  ],
};

// -------------------------------------------------------------- labelling

/**
 * Turns one group value from a result row into text. `lookups` resolves ids
 * to names inside the signed-in app; the anonymous viewer has no access to
 * members/projects, so there ids fall back to a short, neutral reference.
 */
export function groupValueLabel(
  entity: AnalyticsEntity,
  groupByEntry: string,
  value: unknown,
  lookups?: ValueLabeler
): string {
  const { field, unit } = parseGroupByEntry(groupByEntry);
  if (value === null || value === undefined || value === "") {
    return field === "assigneeId" ? "Sem responsável" : "Sem valor";
  }
  const text = String(value);

  if (unit) {
    switch (unit) {
      case "day":
        return formatDate(text, "d MMM");
      case "week":
        return `Sem. de ${formatDate(text, "d MMM")}`;
      case "month":
        return formatDate(text, "MMM yyyy");
    }
  }

  const kind = CATEGORICAL_FIELDS[entity].find((spec) => spec.field === field)?.kind ?? "text";
  if (lookups) return lookups.labelFor(kind, text);

  switch (kind) {
    case "taskStatus":
      return (TASK_STATUS_LABEL as Record<string, string>)[text] ?? text;
    case "taskPriority":
      return (TASK_PRIORITY_LABEL as Record<string, string>)[text] ?? text;
    case "projectStatus":
      return (PROJECT_STATUS_LABEL as Record<string, string>)[text] ?? text;
    case "member":
      return `Pessoa ${shortenId(text, 4)}`;
    case "project":
      return `Projeto ${shortenId(text, 4)}`;
    case "section":
      return `Coluna ${shortenId(text, 4)}`;
    default:
      return text;
  }
}

// ------------------------------------------------------------------ drafts

export interface ChartDraft {
  chartType: DashboardChartType | null;
  entity: AnalyticsEntity;
  metricKeys: string[];
  groupField: string;
  temporalUnit: TemporalUnit;
  conditions: ConditionDraft[];
  name: string;
}

export const EMPTY_DRAFT: ChartDraft = {
  chartType: null,
  entity: "tasks",
  metricKeys: [],
  groupField: "",
  temporalUnit: "week",
  conditions: [],
  name: "",
};

export function metricOptionsFor(draft: ChartDraft): MetricOption[] {
  const spec = draft.chartType ? chartTypeSpec(draft.chartType) : null;
  return METRIC_OPTIONS.filter(
    (option) =>
      option.entities.includes(draft.entity) && !(spec?.countOnly && option.unit !== "count")
  );
}

/**
 * Brings a draft back in line with its chart type and entity after either
 * changes — the choices made first narrow what the later steps can hold, so
 * a leftover second metric on a pie or a category on a line never survives.
 */
export function normalizeDraft(draft: ChartDraft): ChartDraft {
  if (!draft.chartType) return draft;
  const spec = chartTypeSpec(draft.chartType);

  const available = new Set(metricOptionsFor(draft).map((option) => option.key));
  let metricKeys = draft.metricKeys.filter((key) => available.has(key));
  if (metricKeys.length === 0) metricKeys = ["count"];
  if (!spec.multiMetric) metricKeys = metricKeys.slice(0, 1);
  const unit = findMetricOption(metricKeys[0])?.unit;
  metricKeys = metricKeys.filter((key) => findMetricOption(key)?.unit === unit);

  const groupFields = groupFieldsFor(draft.entity, spec.grouping);
  let groupField = draft.groupField;
  if (spec.grouping === "none") groupField = "";
  else if (!groupFields.some((f) => f.field === groupField)) groupField = groupFields[0]?.field ?? "";

  const filterFields = new Set(FILTER_FIELDS[draft.entity].map((f) => f.field));
  const conditions = draft.conditions.filter((c) => c.field === "" || filterFields.has(c.field));

  return { ...draft, metricKeys, groupField, conditions };
}

/** `null` while a step is still incomplete — the preview and Save wait for it. */
export function draftToQuery(draft: ChartDraft): ChartQuery | null {
  if (!draft.chartType || draft.metricKeys.length === 0) return null;
  const spec = chartTypeSpec(draft.chartType);
  if (spec.grouping !== "none" && !draft.groupField) return null;
  if (draft.conditions.some((condition) => !isConditionComplete(condition))) return null;

  const metrics = draft.metricKeys
    .map((key) => findMetricOption(key)?.metric)
    .filter((metric): metric is AnalyticsMetric => Boolean(metric));

  const groupBy =
    spec.grouping === "none"
      ? []
      : [
          isTemporalField(draft.entity, draft.groupField)
            ? `${draft.groupField}:${draft.temporalUnit}`
            : draft.groupField,
        ];

  const kindOf = (field: string) =>
    FILTER_FIELDS[draft.entity].find((spec) => spec.field === field)?.kind ?? "text";

  return {
    entity: draft.entity,
    metrics,
    groupBy,
    filters: draft.conditions.map((condition) => ({
      field: condition.field,
      operator: condition.operator,
      value: conditionValueForRequest(condition.operator, condition.value, kindOf(condition.field)),
    })),
  };
}

export function draftFromChart(chart: ChartDefinition): ChartDraft {
  const { field, unit } = parseGroupByEntry(chart.query.groupBy?.[0] ?? "");
  return {
    chartType: chart.chartType,
    entity: chart.query.entity,
    metricKeys: chart.query.metrics.map(metricKey),
    groupField: field,
    temporalUnit: unit ?? "week",
    conditions: (chart.query.filters ?? []).map((filter) => ({
      key: nextConditionKey(),
      field: filter.field,
      operator: filter.operator,
      value: Array.isArray(filter.value) ? filter.value.map(String) : String(filter.value ?? ""),
    })),
    name: chart.name,
  };
}

/** "Tarefas por status", "Taxa de conclusão por semana"… — a starting point the user can edit. */
export function suggestChartName(draft: ChartDraft): string {
  if (!draft.chartType) return "";
  const metrics = draft.metricKeys.map((key) => findMetricOption(key));
  const subject =
    metrics.length === 1 && metrics[0]?.key !== "count"
      ? metrics[0]?.label ?? ""
      : draft.chartType === "NUMBER"
        ? `Total de ${entityPlural(draft.entity)}`
        : ENTITY_OPTIONS.find((option) => option.value === draft.entity)?.label ?? "";

  if (!draft.groupField) return subject;

  if (isTemporalField(draft.entity, draft.groupField)) {
    const unit = TEMPORAL_UNIT_OPTIONS.find((option) => option.value === draft.temporalUnit);
    const field = TEMPORAL_FIELDS[draft.entity].find((spec) => spec.field === draft.groupField);
    return `${subject} por ${unit?.label.toLowerCase()} (${field?.label.toLowerCase()})`;
  }
  const field = CATEGORICAL_FIELDS[draft.entity].find((spec) => spec.field === draft.groupField);
  return `${subject} por ${field?.label.toLowerCase()}`;
}

// --------------------------------------------------------------- placement

export const GRID_COLUMNS = 12;

/** A new chart goes below everything already on the page, never on top of it. */
export function nextChartPosition(
  existing: { position: ChartPosition }[],
  chartType: DashboardChartType
): ChartPosition {
  const { width, height } = chartTypeSpec(chartType).defaultSize;
  const y = existing.reduce((max, chart) => Math.max(max, chart.position.y + chart.position.height), 0);
  return { x: 0, y, width, height };
}
