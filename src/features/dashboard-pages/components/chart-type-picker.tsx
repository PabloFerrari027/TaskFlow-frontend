"use client";

import { BarChart3, Hash, LineChart, PieChart, type LucideIcon } from "lucide-react";
import { CHART_TYPE_SPECS } from "@/features/dashboard-pages/lib/chart-catalog";
import { cn } from "@/lib/utils";
import type { DashboardChartType } from "@/types/dashboard-page";

const ICON: Record<DashboardChartType, LucideIcon> = {
  BAR: BarChart3,
  PIE: PieChart,
  LINE: LineChart,
  NUMBER: Hash,
};

/**
 * First step of the builder, on purpose: the type decides what the later
 * steps may offer (a pie takes one category, a line only dates, a number no
 * grouping at all). Big pictured options — people recognise a chart shape
 * faster than they read its name.
 */
export function ChartTypePicker({
  value,
  onChange,
}: {
  value: DashboardChartType | null;
  onChange: (type: DashboardChartType) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de gráfico" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CHART_TYPE_SPECS.map((spec) => {
        const Icon = ICON[spec.type];
        const selected = value === spec.type;
        return (
          <button
            key={spec.type}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(spec.type)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              selected
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("size-6", selected && "text-primary")} />
            <span className="text-sm font-medium">{spec.label}</span>
            <span className="text-[0.7rem] leading-tight text-muted-foreground">{spec.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
