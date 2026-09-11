"use client";

import { BarChart3 } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export interface CategoryBarChartRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

const chartConfig = {
  value: { label: "Valor" },
} satisfies ChartConfig;

const ROW_HEIGHT = 32;

/**
 * A small horizontal bar chart — built on Recharts via shadcn's `chart`
 * wrapper (ARCHITECTURE.md § 12). Every bar gets its own color from the
 * `--analytics-cat-1..6` CVD-safe palette passed in per row, not shadcn's
 * own `--chart-1..5` (those fail contrast for the first two categories).
 */
export function CategoryBarChart({
  rows,
  isLoading,
  emptyTitle = "Sem dados para exibir ainda",
}: {
  rows: CategoryBarChartRow[];
  isLoading?: boolean;
  emptyTitle?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (total === 0) {
    return <EmptyState icon={<BarChart3 className="size-5" />} title={emptyTitle} />;
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: Math.max(rows.length * ROW_HEIGHT, ROW_HEIGHT * 2) }}
    >
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 0, right: 28, top: 0, bottom: 0 }}
        barCategoryGap={6}
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          width={132}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as CategoryBarChartRow | undefined)?.label ?? ""
              }
            />
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {rows.map((row) => (
            <Cell key={row.key} fill={row.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground text-xs font-medium tabular-nums"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
