"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { formatMetricValue } from "@/features/dashboard-pages/lib/chart-catalog";
import {
  MAX_CATEGORY_COLORS,
  OTHER_COLOR,
  buildRows,
  buildSeries,
  categoryColor,
  enumOrderFor,
} from "@/features/dashboard-pages/lib/chart-data";
import {
  EmptyChart,
  SeriesTooltipContent,
} from "@/features/dashboard-pages/components/renderers/renderer-parts";
import { formatRatio } from "@/lib/format";
import type { AnalyticsResult } from "@/types/analytics";

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * A donut with its key beside it — every slice listed with its value and
 * share, so no one has to match colours to read it. Always one count metric
 * split by one category (the builder enforces both). More categories than
 * the palette has hues fold into a grey "Outros" slice.
 */
export function PieChartRenderer({
  result,
  lookups,
}: {
  result: AnalyticsResult;
  lookups?: ValueLabeler;
}) {
  const [series] = buildSeries(result);
  if (!series) return <EmptyChart />;

  const order = enumOrderFor(result);
  const rows = buildRows(result, lookups).filter((row) => (row.values[series.alias] ?? 0) > 0);
  if (rows.length === 0) return <EmptyChart />;

  // Status/priority keep their colour whatever else is in the result.
  const colorOf = (key: string, rank: number) =>
    categoryColor(order && order.includes(key) ? order.indexOf(key) : rank);

  let slices: Slice[] = rows.map((row, rank) => ({
    key: row.key,
    label: row.label,
    value: row.values[series.alias] ?? 0,
    color: colorOf(row.key, rank),
  }));
  if (slices.length > MAX_CATEGORY_COLORS) {
    const byValue = [...slices].sort((a, b) => b.value - a.value);
    const kept = byValue.slice(0, MAX_CATEGORY_COLORS - 1);
    const rest = byValue.slice(MAX_CATEGORY_COLORS - 1);
    slices = [
      ...kept.map((slice, rank) => ({ ...slice, color: categoryColor(rank) })),
      {
        key: "__other",
        label: "Outros",
        value: rest.reduce((sum, slice) => sum + slice.value, 0),
        color: OTHER_COLOR,
      },
    ];
  }

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const config = { [series.alias]: { label: series.label } } satisfies ChartConfig;
  const colorByKey = new Map(slices.map((slice) => [slice.key, slice.color]));

  return (
    <div className="flex h-full min-h-0 items-center gap-4">
      <ChartContainer config={config} className="aspect-square h-full max-h-full min-h-0 min-w-0 flex-1">
        <PieChart>
          <ChartTooltip
            content={(props) => (
              <SeriesTooltipContent
                {...props}
                series={[series]}
                colorFor={(item) => colorByKey.get((item.payload as Slice | undefined)?.key ?? "")}
              />
            )}
          />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="55%"
            outerRadius="90%"
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="min-w-0 max-h-full shrink-0 space-y-1.5 overflow-y-auto text-xs">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: slice.color }} />
            <span className="truncate text-muted-foreground">{slice.label}</span>
            <span className="ml-auto pl-2 font-medium text-foreground tabular-nums">
              {formatMetricValue(series.metric, slice.value)}
            </span>
            <span className="w-9 text-right text-muted-foreground tabular-nums">
              {formatRatio(slice.value / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
