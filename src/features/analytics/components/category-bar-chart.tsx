import { BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export interface CategoryBarChartRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * A small horizontal bar list — every value is labeled directly, so there's
 * no legend box or axis to read: hover/focus a row for a tooltip repeating
 * the same numbers already on screen.
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

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-1">
      {rows.map((row) => {
        const widthPercent = row.value > 0 ? Math.max((row.value / max) * 100, 2) : 0;
        return (
          <Tooltip key={row.key}>
            <TooltipTrigger asChild>
              <div
                tabIndex={0}
                className="group -mx-1 flex items-center gap-3 rounded-md px-1 py-1 outline-none focus-visible:bg-muted/60"
              >
                <span className="w-24 shrink-0 truncate text-xs text-muted-foreground sm:w-36">
                  {row.label}
                </span>
                <div className="h-5 flex-1 rounded-sm bg-muted/60">
                  <div
                    className="h-5 rounded-r-[4px] transition-[filter] group-hover:brightness-110"
                    style={{ width: `${widthPercent}%`, backgroundColor: row.color }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                  {row.value}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {row.label}: {row.value}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
