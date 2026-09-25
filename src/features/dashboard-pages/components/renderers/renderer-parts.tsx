"use client";

import { BarChart3 } from "lucide-react";
import { formatMetricValue } from "@/features/dashboard-pages/lib/chart-catalog";
import type { ChartSeries } from "@/features/dashboard-pages/lib/chart-data";

export function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <BarChart3 className="size-5" />
      <p className="text-xs">Sem dados para exibir ainda</p>
    </div>
  );
}

interface TooltipItem {
  dataKey?: unknown;
  value?: unknown;
  payload?: unknown;
}

/**
 * Hover card shared by every plotted chart: the group's label, then one row
 * per series with its colour swatch, name and value — formatted per metric
 * (percent, "3d 4h", count), never the raw number.
 */
export function SeriesTooltipContent({
  active,
  payload,
  series,
  colorFor,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipItem>;
  series: ChartSeries[];
  // Pie slices are coloured per category, not per series.
  colorFor?: (item: TooltipItem) => string | undefined;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as { label?: string } | undefined;

  return (
    <div className="grid min-w-36 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      {row?.label ? <div className="font-medium text-foreground">{row.label}</div> : null}
      {payload.map((item, index) => {
        const current = series.find((s) => s.alias === item.dataKey) ?? series[0];
        if (!current) return null;
        const value = typeof item.value === "number" ? item.value : null;
        return (
          <div key={index} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: colorFor?.(item) ?? current.color }}
            />
            <span className="flex-1 text-muted-foreground">{current.label}</span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {formatMetricValue(current.metric, value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Colour key for charts with 2+ series — identity is never colour alone. */
export function SeriesLegend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
      {series.map((s) => (
        <span key={s.alias} className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px]" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
