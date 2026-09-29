"use client";

import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { BarChartRenderer } from "@/features/dashboard-pages/components/renderers/bar-chart-renderer";
import { LineChartRenderer } from "@/features/dashboard-pages/components/renderers/line-chart-renderer";
import { NumberCardRenderer } from "@/features/dashboard-pages/components/renderers/number-card-renderer";
import { PieChartRenderer } from "@/features/dashboard-pages/components/renderers/pie-chart-renderer";
import type { LegendMode } from "@/features/dashboard-pages/components/renderers/renderer-parts";
import type { AnalyticsResult } from "@/types/analytics";
import type { DashboardChartType } from "@/types/dashboard-page";

/**
 * The one place a chart type becomes a drawing — used by the page grid, the
 * builder's live preview and the anonymous viewer alike. `lookups` turns ids
 * into names where the viewer is allowed to know them (signed-in only).
 * `legend` only reaches bar and line: a pie always lists its categories
 * beside it, and a number card names its metric under the value.
 */
export function ChartRenderer({
  chartType,
  result,
  lookups,
  legend,
}: {
  chartType: DashboardChartType;
  result: AnalyticsResult;
  lookups?: ValueLabeler;
  legend?: LegendMode;
}) {
  switch (chartType) {
    case "BAR":
      return <BarChartRenderer result={result} lookups={lookups} legend={legend} />;
    case "PIE":
      return <PieChartRenderer result={result} lookups={lookups} />;
    case "LINE":
      return <LineChartRenderer result={result} lookups={lookups} legend={legend} />;
    case "NUMBER":
      return <NumberCardRenderer result={result} />;
  }
}
