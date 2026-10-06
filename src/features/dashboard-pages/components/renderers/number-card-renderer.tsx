"use client";

import { formatMetricValue } from "@/features/dashboard-pages/lib/chart-catalog";
import { buildSeries } from "@/features/dashboard-pages/lib/chart-data";
import { EmptyChart } from "@/features/dashboard-pages/components/renderers/renderer-parts";
import type { AnalyticsResult } from "@/types/analytics";

/**
 * A single headline value — no plot, so no colour and no hover layer.
 * `label` replaces the metric's generic name ("Quantidade") when the caller
 * knows what is being counted ("Itens em aberto").
 */
export function NumberCardRenderer({ result, label }: { result: AnalyticsResult; label?: string }) {
  const [series] = buildSeries(result);
  if (!series) return <EmptyChart />;

  const raw = result.data[0]?.[series.alias];
  const parsed = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
  const value = parsed !== null && Number.isFinite(parsed) ? parsed : null;

  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {/* "Sem dados" is a note, not a headline — it must not look like a value. */}
      {value === null ? (
        <p className="text-sm text-muted-foreground">Sem dados para exibir ainda</p>
      ) : (
        <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
          {formatMetricValue(series.metric, value)}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{label ?? series.label}</p>
    </div>
  );
}
