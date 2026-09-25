"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlinePicker } from "@/features/automations/components/inline-fields";
import { TriggerConditionPicker } from "@/features/automations/components/trigger-condition-picker";
import type {
  AutomationLookups,
  PickerOption,
} from "@/features/automations/hooks/use-automation-lookups";
import { nextConditionKey, type ConditionDraft } from "@/features/automations/lib/automation-draft";
import { useAnalyticsQuery } from "@/features/analytics/hooks/use-analytics";
import { ChartTypePicker } from "@/features/dashboard-pages/components/chart-type-picker";
import { ChartRenderer } from "@/features/dashboard-pages/components/renderers/chart-renderer";
import {
  EMPTY_DRAFT,
  ENTITY_OPTIONS,
  FILTER_FIELDS,
  METRIC_OPTIONS,
  TEMPORAL_FIELDS,
  TEMPORAL_UNIT_OPTIONS,
  chartTypeSpec,
  draftFromChart,
  draftToQuery,
  groupFieldsFor,
  metricOptionsFor,
  nextChartPosition,
  normalizeDraft,
  suggestChartName,
  type ChartDraft,
} from "@/features/dashboard-pages/lib/chart-catalog";
import {
  useCreateChartMutation,
  useUpdateChartMutation,
} from "@/features/dashboard-pages/hooks/use-chart-definitions";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { AnalyticsEntity } from "@/types/analytics";
import type { ChartQuery, ChartWithResult, DashboardChartType } from "@/types/dashboard-page";

const ROW_CLASS = "flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm leading-7";
// Long enough that picking several options in a row fires one query, short
// enough that the preview still feels live.
const PREVIEW_DELAY_MS = 400;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Step({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-3 rounded-lg border border-border/60 p-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-md border border-border p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PreviewPanel({
  workspaceId,
  chartType,
  query,
  lookups,
}: {
  workspaceId: string;
  chartType: DashboardChartType | null;
  query: ChartQuery | null;
  lookups: AutomationLookups;
}) {
  // Type and query travel together, so a result is never drawn as a chart
  // type it wasn't fetched for while the next query is on its way.
  const pending = React.useMemo(() => ({ chartType, query }), [chartType, query]);
  const settled = useDebouncedValue(pending, PREVIEW_DELAY_MS);
  const preview = useAnalyticsQuery(
    settled.query ? workspaceId : null,
    settled.query ?? { entity: "tasks", metrics: [] },
    { keepPreviousResult: true, retry: false }
  );
  const [shownType, setShownType] = React.useState(settled.chartType);
  if (preview.data && !preview.isPlaceholderData && shownType !== settled.chartType) {
    setShownType(settled.chartType);
  }

  let body: React.ReactNode;
  if (!query || !chartType) {
    body = (
      <p className="text-center text-xs text-muted-foreground">
        Complete os passos ao lado para ver o gráfico aqui, já com os dados reais.
      </p>
    );
  } else if (preview.isError) {
    body = (
      <div className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle className="size-5 text-destructive" />
        <p className="max-w-xs text-xs text-muted-foreground">{getErrorMessage(preview.error)}</p>
      </div>
    );
  } else if (!preview.data || !shownType) {
    body = <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  } else {
    body = (
      <div className="h-full w-full">
        <ChartRenderer chartType={shownType} result={preview.data} lookups={lookups} />
      </div>
    );
  }

  const stale = pending !== settled || preview.isFetching;

  return (
    <div className="flex h-full min-h-72 flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Pré-visualização
        </span>
        {query && stale ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
      </div>
      <div className={cn("flex min-h-0 flex-1 items-center justify-center transition-opacity", query && stale && "opacity-60")}>
        {body}
      </div>
    </div>
  );
}

/**
 * Builds a chart one decision at a time: type → what to count → how much →
 * split by what → only which items → see it → name it. Every step's options
 * are narrowed by the steps before it (see `normalizeDraft`), and the preview
 * runs the real query as soon as the draft is complete — nobody has to save
 * to find out what they made.
 */
export function ChartBuilderDialog({
  open,
  onOpenChange,
  workspaceId,
  pageId,
  existingCharts,
  chart,
  lookups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  pageId: string;
  existingCharts: ChartWithResult[];
  // Set when editing; absent when adding a new chart.
  chart?: ChartWithResult;
  lookups: AutomationLookups;
}) {
  const [draft, setDraft] = React.useState<ChartDraft>(() =>
    chart ? draftFromChart(chart) : EMPTY_DRAFT
  );
  // Until the user types a name of their own, it follows the choices made.
  const [nameTouched, setNameTouched] = React.useState(Boolean(chart));
  const createMutation = useCreateChartMutation(pageId);
  const updateMutation = useUpdateChartMutation(pageId);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const update = (patch: Partial<ChartDraft>) =>
    setDraft((current) => {
      const next = normalizeDraft({ ...current, ...patch });
      return nameTouched ? next : { ...next, name: suggestChartName(next) };
    });

  const query = React.useMemo(() => draftToQuery(draft), [draft]);
  const spec = draft.chartType ? chartTypeSpec(draft.chartType) : null;
  const name = draft.name.trim();
  const canSave = Boolean(query && draft.chartType && name) && !isSaving;

  function handleSave() {
    if (!query || !draft.chartType || !name) return;
    const close = { onSuccess: () => onOpenChange(false) };
    if (chart) {
      updateMutation.mutate(
        { chartId: chart.id, payload: { name, chartType: draft.chartType, query } },
        close
      );
    } else {
      createMutation.mutate(
        {
          name,
          chartType: draft.chartType,
          query,
          position: nextChartPosition(existingCharts, draft.chartType),
        },
        close
      );
    }
  }

  // ---- step option lists

  const metricOptions = metricOptionsFor(draft);
  const firstUnit = METRIC_OPTIONS.find((o) => o.key === draft.metricKeys[0])?.unit;
  const optionsForSlot = (index: number): PickerOption[] =>
    metricOptions
      .filter(
        (option) =>
          // Other slots can't repeat a metric, and extra metrics must share
          // the first one's unit (one axis, one scale).
          (option.key === draft.metricKeys[index] || !draft.metricKeys.includes(option.key)) &&
          (index === 0 || option.unit === firstUnit)
      )
      .map((option) => ({ value: option.key, label: option.label }));
  const canAddMetric =
    Boolean(spec?.multiMetric) && optionsForSlot(draft.metricKeys.length).length > 0;

  const groupOptions: PickerOption[] = spec
    ? groupFieldsFor(draft.entity, spec.grouping).map((field) => ({
        value: field.field,
        label: field.label,
        group: spec.grouping === "any"
          ? TEMPORAL_FIELDS[draft.entity].some((t) => t.field === field.field)
            ? "Por período"
            : "Por categoria"
          : undefined,
      }))
    : [];
  const groupIsTemporal = TEMPORAL_FIELDS[draft.entity].some((f) => f.field === draft.groupField);

  const filterFields = FILTER_FIELDS[draft.entity];
  const updateCondition = (next: ConditionDraft) =>
    update({ conditions: draft.conditions.map((c) => (c.key === next.key ? next : c)) });

  let step = 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{chart ? "Editar gráfico" : "Novo gráfico"}</DialogTitle>
          <DialogDescription>
            Escolha passo a passo o que mostrar. A pré-visualização usa os dados reais do workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <Step number={step++} title="Tipo de gráfico" hint="O tipo define as opções dos próximos passos.">
              <ChartTypePicker value={draft.chartType} onChange={(chartType) => update({ chartType })} />
            </Step>

            {spec ? (
              <>
                <Step number={step++} title="O que analisar">
                  <Segmented<AnalyticsEntity>
                    ariaLabel="O que analisar"
                    value={draft.entity}
                    options={ENTITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={(entity) => update({ entity })}
                  />
                </Step>

                <Step
                  number={step++}
                  title={spec.multiMetric ? "O que medir" : "O que medir (um valor)"}
                  hint={
                    spec.countOnly
                      ? "Pizza divide uma quantidade em partes — por isso só mede quantidades."
                      : draft.entity === "projects"
                        ? "Taxas e tempos existem só para tarefas."
                        : spec.multiMetric
                          ? "Pode adicionar mais de uma medida do mesmo tipo (ex.: duas taxas)."
                          : undefined
                  }
                >
                  {draft.metricKeys.map((key, index) => (
                    <div key={`${index}-${key}`} className={ROW_CLASS}>
                      <InlinePicker
                        value={key}
                        options={optionsForSlot(index)}
                        placeholder="escolher medida"
                        ariaLabel={`Medida ${index + 1}`}
                        onChange={(next) =>
                          update({
                            metricKeys: draft.metricKeys.map((k, i) => (i === index ? next : k)),
                          })
                        }
                      />
                      {index > 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remover medida"
                          onClick={() =>
                            update({ metricKeys: draft.metricKeys.filter((_, i) => i !== index) })
                          }
                        >
                          <X />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  {canAddMetric ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        const [first] = optionsForSlot(draft.metricKeys.length);
                        if (first) update({ metricKeys: [...draft.metricKeys, first.value] });
                      }}
                    >
                      <Plus /> Adicionar medida
                    </Button>
                  ) : null}
                </Step>

                {spec.grouping !== "none" ? (
                  <Step
                    number={step++}
                    title="Separar por"
                    hint={
                      spec.grouping === "temporal"
                        ? "Linha sempre mostra a evolução no tempo: escolha a data e o intervalo."
                        : spec.grouping === "categorical"
                          ? "Cada fatia é um valor deste campo."
                          : "Uma categoria (status, responsável…) ou um período de tempo."
                    }
                  >
                    <div className={ROW_CLASS}>
                      <InlinePicker
                        value={draft.groupField}
                        options={groupOptions}
                        placeholder="escolher campo"
                        ariaLabel="Separar por"
                        onChange={(groupField) => update({ groupField })}
                      />
                      {groupIsTemporal ? (
                        <>
                          <span className="text-muted-foreground">a cada</span>
                          <Segmented
                            ariaLabel="Intervalo"
                            value={draft.temporalUnit}
                            options={TEMPORAL_UNIT_OPTIONS}
                            onChange={(temporalUnit) => update({ temporalUnit })}
                          />
                        </>
                      ) : null}
                    </div>
                  </Step>
                ) : null}

                <Step
                  number={step++}
                  title="Filtros (opcional)"
                  hint="Sem filtros, o gráfico considera tudo do workspace."
                >
                  {draft.conditions.map((condition, index) => (
                    <div key={condition.key} className={ROW_CLASS}>
                      <TriggerConditionPicker
                        lead={index === 0 ? "Somente se" : "e"}
                        condition={condition}
                        fields={filterFields}
                        lookups={lookups}
                        onChange={updateCondition}
                        onRemove={() =>
                          update({ conditions: draft.conditions.filter((c) => c.key !== condition.key) })
                        }
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      update({
                        conditions: [
                          ...draft.conditions,
                          { key: nextConditionKey(), field: "", operator: "equals", value: "" },
                        ],
                      })
                    }
                  >
                    <Plus /> Adicionar filtro
                  </Button>
                </Step>

                <Step number={step++} title="Nome do gráfico">
                  <Label htmlFor="chart-name" className="sr-only">
                    Nome do gráfico
                  </Label>
                  <Input
                    id="chart-name"
                    value={draft.name}
                    maxLength={120}
                    placeholder="Ex.: Tarefas por status"
                    onChange={(event) => {
                      setNameTouched(true);
                      setDraft((current) => ({ ...current, name: event.target.value }));
                    }}
                  />
                </Step>
              </>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-0 lg:h-[26rem]">
            <PreviewPanel
              workspaceId={workspaceId}
              chartType={draft.chartType}
              query={query}
              lookups={lookups}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            {chart ? "Salvar alterações" : "Adicionar gráfico"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
