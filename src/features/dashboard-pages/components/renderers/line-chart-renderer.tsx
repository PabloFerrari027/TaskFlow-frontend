"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { formatMetricValue } from "@/features/dashboard-pages/lib/chart-catalog";
import { buildRows, buildSeries, flattenRows } from "@/features/dashboard-pages/lib/chart-data";
import {
  EmptyChart,
  SeriesLegend,
  SeriesTooltipContent,
} from "@/features/dashboard-pages/components/renderers/renderer-parts";
import type { AnalyticsResult } from "@/types/analytics";

// With few points each one is worth marking; with many, dots become clutter
// and the hover crosshair does the job.
const MAX_DOTTED_POINTS = 16;

/** Always a time series — the builder only offers a date grouping for LINE. */
export function LineChartRenderer({
  result,
  lookups,
}: {
  result: AnalyticsResult;
  lookups?: ValueLabeler;
}) {
  const series = buildSeries(result);
  const rows = buildRows(result, lookups);
  if (rows.length === 0 || series.length === 0) return <EmptyChart />;

  const data = flattenRows(rows);
  const config = Object.fromEntries(
    series.map((s) => [s.alias, { label: s.label, color: s.color }])
  ) satisfies ChartConfig;
  const dotted = rows.length <= MAX_DOTTED_POINTS;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChartContainer config={config} className="aspect-auto min-h-0 w-full flex-1">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              formatMetricValue(series[0].metric, typeof value === "number" ? value : null)
            }
          />
          <ChartTooltip content={(props) => <SeriesTooltipContent {...props} series={series} />} />
          {series.map((s) => (
            <Line
              key={s.alias}
              dataKey={s.alias}
              type="linear"
              stroke={s.color}
              strokeWidth={2}
              connectNulls
              dot={dotted ? { r: 4, fill: s.color, stroke: "var(--card)", strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: s.color, stroke: "var(--card)", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <SeriesLegend series={series} />
    </div>
  );
}
