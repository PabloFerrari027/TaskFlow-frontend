"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { ChartRenderer } from "@/features/dashboard-pages/components/renderers/chart-renderer";
import { describeChartQuery } from "@/features/dashboard-pages/lib/chart-catalog";
import { cn } from "@/lib/utils";
import type { ChartWithResult } from "@/types/dashboard-page";

/**
 * One chart at reading size: the whole description instead of a truncated
 * line, and the colour key shown even for a single series. Read-only for
 * everyone — editing stays on the card's menu.
 */
export function ChartExpandDialog({
  chart,
  lookups,
  onOpenChange,
}: {
  chart: ChartWithResult | null;
  lookups?: ValueLabeler;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={chart !== null} onOpenChange={onOpenChange}>
      {chart ? (
        <DialogContent
          className={cn(
            "flex flex-col sm:max-w-5xl",
            // A single number needs no canvas; a plot gets most of the screen.
            chart.chartType === "NUMBER" ? "h-72" : "h-[min(85vh,720px)]"
          )}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>{chart.name}</DialogTitle>
            <DialogDescription>{describeChartQuery(chart.query, lookups).join(" · ")}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            <ChartRenderer
              chartType={chart.chartType}
              result={chart.result}
              lookups={lookups}
              legend="always"
            />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
