"use client";

import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { CHART_TYPE_ICON } from "@/features/dashboard-pages/components/chart-type-picker";
import { ChartRenderer } from "@/features/dashboard-pages/components/renderers/chart-renderer";
import { cn } from "@/lib/utils";
import type { ChartWithResult } from "@/types/dashboard-page";

// Class names the grid uses as drag handle / drag cancel (dashboard-grid.tsx).
export const WIDGET_DRAG_HANDLE = "chart-widget-handle";
export const WIDGET_NO_DRAG = "chart-widget-no-drag";

/**
 * The frame every chart sits in: title bar, optional edit/remove menu, body.
 * The same frame is used read-only (no menu, no grip) — whether a viewer can
 * change anything is decided by the page, never by the widget.
 */
export function ChartWidget({
  chart,
  lookups,
  draggable = false,
  onEdit,
  onRemove,
}: {
  chart: ChartWithResult;
  lookups?: ValueLabeler;
  draggable?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const hasMenu = Boolean(onEdit || onRemove);
  const TypeIcon = CHART_TYPE_ICON[chart.chartType];

  return (
    <Card size="sm" className="h-full gap-3 px-4 transition-shadow hover:shadow-md">
      <div
        className={cn(
          "flex min-h-7 items-center gap-2",
          draggable && `${WIDGET_DRAG_HANDLE} cursor-grab active:cursor-grabbing`
        )}
      >
        {draggable ? (
          <GripVertical aria-hidden className="-ml-1.5 size-4 shrink-0 text-muted-foreground/60" />
        ) : null}
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <TypeIcon aria-hidden className="size-3.5" />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={chart.name}>
          {chart.name}
        </h3>
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={WIDGET_NO_DRAG}
                aria-label={`Opções do gráfico ${chart.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit ? (
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil /> Editar
                </DropdownMenuItem>
              ) : null}
              {onRemove ? (
                <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                  <Trash2 /> Remover
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        <ChartRenderer chartType={chart.chartType} result={chart.result} lookups={lookups} />
      </div>
    </Card>
  );
}
