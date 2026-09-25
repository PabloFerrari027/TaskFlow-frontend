"use client";

import { formatMetricValue } from "@/features/dashboard-pages/lib/chart-catalog";
import { buildSeries } from "@/features/dashboard-pages/lib/chart-data";
import { EmptyChart } from "@/features/dashboard-pages/components/renderers/renderer-parts";
import type { AnalyticsResult } from "@/types/analytics";

/** A single headline value — no plot, so no colour and no hover layer. */
export function NumberCardRenderer({ result }: { result: AnalyticsResult }) {
  const [series] = buildSeries(result);
  if (!series) return <EmptyChart />;

  const raw = result.data[0]?.[series.alias];
  const value = typeof raw === "number" ? raw : raw == null ? null : Number(raw);

  return (
    <div className="flex h-full flex-col justify-center gap-1">
      <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {formatMetricValue(series.metric, value !== null && Number.isFinite(value) ? value : null)}
      </p>
      <p className="text-xs text-muted-foreground">{series.label}</p>
    </div>
  );
}
