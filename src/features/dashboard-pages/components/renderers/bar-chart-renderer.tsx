"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { formatMetricValue } from "@/features/dashboard-pages/lib/chart-catalog";
import {
  buildRows,
  buildSeries,
  flattenRows,
  isTemporalResult,
} from "@/features/dashboard-pages/lib/chart-data";
import {
  EmptyChart,
  SeriesLegend,
  SeriesTooltipContent,
} from "@/features/dashboard-pages/components/renderers/renderer-parts";
import type { AnalyticsResult } from "@/types/analytics";

// Past this many bars, a number on each one turns into noise.
const MAX_LABELLED_BARS = 12;

/**
 * Categories run as horizontal bars (long names stay readable on the left
 * axis, like the fixed dashboard's CategoryBarChart); periods run as
 * columns, left to right in time. Several metrics sit side by side with a
 * 2px gap and a legend; a single metric is labelled directly instead.
 */
export function BarChartRenderer({
  result,
  lookups,
}: {
  result: AnalyticsResult;
  lookups?: ValueLabeler;
}) {
  const series = buildSeries(result);
  const rows = buildRows(result, lookups);
  if (rows.length === 0 || series.length === 0) return <EmptyChart />;

  const temporal = isTemporalResult(result);
  const data = flattenRows(rows);
  const config = Object.fromEntries(
    series.map((s) => [s.alias, { label: s.label, color: s.color }])
  ) satisfies ChartConfig;
  const labelled = series.length === 1 && rows.length <= MAX_LABELLED_BARS;
  const format = (value: unknown) =>
    formatMetricValue(series[0].metric, typeof value === "number" ? value : null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChartContainer config={config} className="aspect-auto min-h-0 w-full flex-1">
        {temporal ? (
          <BarChart data={data} margin={{ top: 18, right: 4, left: 4, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={12} />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => format(value)}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={(props) => <SeriesTooltipContent {...props} series={series} />}
            />
            {series.map((s) => (
              <Bar key={s.alias} dataKey={s.alias} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={40}>
                {labelled ? (
                  <LabelList
                    dataKey={s.alias}
                    position="top"
                    className="fill-foreground text-xs tabular-nums"
                    formatter={(value) => format(value)}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        ) : (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: labelled ? 48 : 8, left: 0, bottom: 0 }}
            barGap={2}
            barCategoryGap={6}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              width={112}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={(props) => <SeriesTooltipContent {...props} series={series} />}
            />
            {series.map((s) => (
              <Bar key={s.alias} dataKey={s.alias} fill={s.color} radius={[0, 4, 4, 0]} maxBarSize={28}>
                {labelled ? (
                  <LabelList
                    dataKey={s.alias}
                    position="right"
                    className="fill-foreground text-xs font-medium tabular-nums"
                    formatter={(value) => format(value)}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        )}
      </ChartContainer>
      <SeriesLegend series={series} />
    </div>
  );
}
