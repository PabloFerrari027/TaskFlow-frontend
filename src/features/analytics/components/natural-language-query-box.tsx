"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNaturalLanguageQueryMutation } from "@/features/analytics/hooks/use-analytics";
import { StatCard } from "@/features/analytics/components/stat-card";
import {
  CategoryBarChart,
  type CategoryBarChartRow,
} from "@/features/analytics/components/category-bar-chart";
import {
  TASK_STATUS_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
} from "@/components/shared/status-badge";
import { formatDate, shortenId } from "@/lib/format";
import { DERIVED_METRIC_LABEL, formatDerivedMetricValue } from "@/features/analytics/lib/derived-metrics";
import type {
  AnalyticsEntity,
  AnalyticsMetric,
  AnalyticsQuery,
  AnalyticsResult,
} from "@/types/analytics";
import type { ProjectStatus } from "@/types/project";
import type { TaskPriority, TaskStatus } from "@/types/task";

const MAX_QUESTION_LENGTH = 500;
const MAX_CHART_ROWS = 10;
const DATE_FIELDS = new Set(["dueDate", "createdAt", "updatedAt"]);

const ENTITY_LABEL: Record<AnalyticsEntity, string> = {
  tasks: "tarefas",
  projects: "projetos",
};

const FIELD_LABEL: Record<string, string> = {
  id: "ID",
  status: "status",
  assigneeId: "responsável",
  projectId: "projeto",
  sectionId: "coluna",
  createdAt: "criado em",
  updatedAt: "atualizado em",
  dueDate: "prazo",
  priority: "prioridade",
  createdBy: "criado por",
  workspaceId: "workspace",
};

const OPERATOR_LABEL: Record<string, string> = {
  equals: "é",
  notEquals: "não é",
  greaterThan: "maior que",
  lessThan: "menor que",
  in: "está em",
  between: "está entre",
};

const METRIC_TYPE_LABEL: Record<string, string> = {
  count: "quantidade",
  sum: "soma",
  average: "média",
};

function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

function valueLabel(entity: AnalyticsEntity, field: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => valueLabel(entity, field, entry)).join(", ");
  }
  if (field === "status" && typeof value === "string") {
    if (entity === "tasks" && value in TASK_STATUS_LABEL) return TASK_STATUS_LABEL[value as TaskStatus];
    if (entity === "projects" && value in PROJECT_STATUS_LABEL) return PROJECT_STATUS_LABEL[value as ProjectStatus];
  }
  if (field === "priority" && typeof value === "string" && value in TASK_PRIORITY_LABEL) {
    return TASK_PRIORITY_LABEL[value as TaskPriority];
  }
  if (DATE_FIELDS.has(field) && typeof value === "string") {
    return formatDate(value);
  }
  if (typeof value === "string" && /^[0-9a-f-]{20,}$/i.test(value)) {
    return shortenId(value);
  }
  return String(value);
}

function metricLabel(metric: AnalyticsMetric): string {
  if (metric.type === "derived") {
    return metric.name ? DERIVED_METRIC_LABEL[metric.name].toLowerCase() : "métrica derivada";
  }
  const typeLabel = METRIC_TYPE_LABEL[metric.type] ?? metric.type;
  return metric.field ? `${typeLabel} de ${fieldLabel(metric.field)}` : typeLabel;
}

function metricDisplayValue(metric: AnalyticsMetric, value: number | null): string {
  if (metric.type === "derived" && metric.name) {
    return formatDerivedMetricValue(metric.name, value);
  }
  return value === null ? "—" : String(value);
}

// Builds the transparency line ("Entendi como: ...") from the structured
// query the AI produced — never hidden, per the backend's design intent.
function describeQuery(query: AnalyticsQuery): string {
  const parts: string[] = [ENTITY_LABEL[query.entity] ?? query.entity];

  if (query.filters?.length) {
    const filterText = query.filters
      .map((filter) => {
        if (filter.operator === "between" && Array.isArray(filter.value) && filter.value.length === 2) {
          const [from, to] = filter.value as [unknown, unknown];
          return `${fieldLabel(filter.field)} entre ${valueLabel(query.entity, filter.field, from)} e ${valueLabel(query.entity, filter.field, to)}`;
        }
        const operatorText = OPERATOR_LABEL[filter.operator] ?? filter.operator;
        return `${fieldLabel(filter.field)} ${operatorText} ${valueLabel(query.entity, filter.field, filter.value)}`;
      })
      .join(", ");
    parts.push(`onde ${filterText}`);
  }

  if (query.groupBy?.length) {
    parts.push(`agrupando por ${query.groupBy.map(fieldLabel).join(" e ")}`);
  }

  if (query.metrics?.length) {
    parts.push(`mostrando ${query.metrics.map(metricLabel).join(", ")}`);
  }

  return parts.join(", ");
}

// A derived metric can legitimately be `null` (insufficient data for that
// group, API.md § 12) — never coerce that to 0, which would mean something
// different ("measured as zero").
function metricValue(row: Record<string, string | number | null>, alias: string): number | null {
  const value = row[alias];
  return typeof value === "number" ? value : null;
}

// Same decision AnalyticsDashboard uses for its fixed charts: no groupBy
// means a single row of numbers (StatCard), otherwise a comparison across
// categories (CategoryBarChart) — never a bespoke renderer for AI results.
function NaturalLanguageResult({
  query,
  result,
}: {
  query: AnalyticsQuery;
  result: AnalyticsResult;
}) {
  if (result.groupBy.length === 0) {
    const row = result.data[0] ?? {};
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {result.metrics.map((metric) => {
          const value = metricValue(row, metric.alias);
          return (
            <StatCard
              key={metric.alias}
              label={metricLabel(metric)}
              value={value ?? 0}
              displayValue={metricDisplayValue(metric, value)}
              icon={Sparkles}
            />
          );
        })}
      </div>
    );
  }

  const primaryMetric = result.metrics[0];
  // Groups with no data for a derived metric (`null`) are dropped instead of
  // drawn as a bar of 0, same as the dashboard's derived-metric charts.
  const sorted = result.data
    .map((row) => ({ row, value: metricValue(row, primaryMetric.alias) }))
    .filter((entry): entry is { row: typeof entry.row; value: number } => entry.value !== null)
    .sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, MAX_CHART_ROWS);

  const rows: CategoryBarChartRow[] = shown.map(({ row, value }, index) => ({
    key: String(index),
    label: result.groupBy
      .map((field) => valueLabel(query.entity, field, row[field]))
      .join(" / "),
    value,
    color: `var(--analytics-cat-${(index % 6) + 1})`,
  }));

  return (
    <div className="space-y-2">
      <CategoryBarChart
        rows={rows}
        emptyTitle="Nenhum resultado para esta pergunta"
        valueFormatter={(value) => metricDisplayValue(primaryMetric, value)}
      />
      {sorted.length > shown.length ? (
        <p className="text-xs text-muted-foreground">
          Mostrando os {shown.length} maiores de {sorted.length} resultados.
        </p>
      ) : null}
    </div>
  );
}

export function NaturalLanguageQueryBox({ workspaceId }: { workspaceId: string }) {
  const [text, setText] = React.useState("");
  const mutation = useNaturalLanguageQueryMutation(workspaceId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate(trimmed);
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" />
          Pergunte em linguagem natural
        </h2>
        <p className="text-xs text-muted-foreground">
          Ex.: &quot;Quantas tarefas atrasadas temos, agrupadas por projeto?&quot;
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_QUESTION_LENGTH))}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Faça uma pergunta sobre suas tarefas e projetos..."
          disabled={mutation.isPending}
        />
        <Button type="submit" disabled={mutation.isPending || !text.trim()}>
          {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
          Perguntar
        </Button>
      </form>

      {mutation.data ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Entendi como: <span className="text-foreground">{describeQuery(mutation.data.query)}</span>
          </p>
          <NaturalLanguageResult query={mutation.data.query} result={mutation.data.result} />
        </div>
      ) : null}
    </Card>
  );
}
