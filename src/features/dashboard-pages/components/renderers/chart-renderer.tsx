"use client";

import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { BarChartRenderer } from "@/features/dashboard-pages/components/renderers/bar-chart-renderer";
import { LineChartRenderer } from "@/features/dashboard-pages/components/renderers/line-chart-renderer";
import { NumberCardRenderer } from "@/features/dashboard-pages/components/renderers/number-card-renderer";
import { PieChartRenderer } from "@/features/dashboard-pages/components/renderers/pie-chart-renderer";
import type { AnalyticsResult } from "@/types/analytics";
import type { DashboardChartType } from "@/types/dashboard-page";

/**
 * The one place a chart type becomes a drawing — used by the page grid, the
 * builder's live preview and the anonymous viewer alike. `lookups` turns ids
 * into names where the viewer is allowed to know them (signed-in only).
 */
export function ChartRenderer({
  chartType,
  result,
  lookups,
}: {
  chartType: DashboardChartType;
  result: AnalyticsResult;
  lookups?: ValueLabeler;
}) {
  switch (chartType) {
    case "BAR":
      return <BarChartRenderer result={result} lookups={lookups} />;
    case "PIE":
      return <PieChartRenderer result={result} lookups={lookups} />;
    case "LINE":
      return <LineChartRenderer result={result} lookups={lookups} />;
    case "NUMBER":
      return <NumberCardRenderer result={result} />;
  }
}
