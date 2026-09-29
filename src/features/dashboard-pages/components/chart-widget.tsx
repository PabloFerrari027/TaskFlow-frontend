"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Maximize2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { ChartRenderer } from "@/features/dashboard-pages/components/renderers/chart-renderer";
import { describeChartQuery } from "@/features/dashboard-pages/lib/chart-catalog";
import { cn } from "@/lib/utils";
import type { ChartWithResult } from "@/types/dashboard-page";

// Class names the grid uses as drag handle / drag cancel (dashboard-grid.tsx).
export const WIDGET_DRAG_HANDLE = "chart-widget-handle";
export const WIDGET_NO_DRAG = "chart-widget-no-drag";

// Controls stay out of sight until the card is pointed at or anything in it
// has keyboard focus — opacity only, so they keep their place in the tab
// order and never shift the title. Touch screens have no hover to reveal
// them, so there they're always shown. An open menu (focus is then in its
// portal, outside the card) keeps the whole bar visible.
const REVEAL_ON_INTEREST =
  "transition-opacity [@media(hover:hover)]:opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 group-has-data-[state=open]/card:opacity-100";

/**
 * The frame every chart sits in: title bar (name + what it measures), then
 * the drawing. The same frame is used read-only — whether a viewer can change
 * anything is decided by the page, never by the widget. Folding and
 * expanding are for everyone, the anonymous viewer included: they only
 * change what this viewer sees.
 */
export function ChartWidget({
  chart,
  lookups,
  draggable = false,
  collapsed = false,
  onToggleCollapsed,
  onExpand,
  onEdit,
  onRemove,
}: {
  chart: ChartWithResult;
  lookups?: ValueLabeler;
  draggable?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onExpand?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const bodyId = React.useId();
  const hasMenu = Boolean(onEdit || onRemove);
  const subtitle = describeChartQuery(chart.query, lookups).join(" · ");

  return (
    <Card
      size="sm"
      className={cn("h-full gap-3 px-4 transition-shadow hover:shadow-md", collapsed && "gap-0")}
    >
      <div
        className={cn(
          "flex items-start gap-2",
          draggable && `${WIDGET_DRAG_HANDLE} cursor-grab active:cursor-grabbing`
        )}
      >
        {draggable ? (
          <GripVertical
            aria-hidden
            className={cn("mt-0.5 -ml-1.5 size-4 shrink-0 text-muted-foreground/60", REVEAL_ON_INTEREST)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground" title={chart.name}>
            {chart.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground" title={subtitle}>
            {subtitle}
          </p>
        </div>
        <div className={cn("-mt-0.5 -mr-1.5 flex shrink-0 items-center", WIDGET_NO_DRAG)}>
          <div className={cn("flex items-center", REVEAL_ON_INTEREST)}>
            {onExpand ? (
              <IconAction label="Expandir" ariaLabel={`Expandir o gráfico ${chart.name}`} onClick={onExpand}>
                <Maximize2 />
              </IconAction>
            ) : null}
            {hasMenu ? (
              <DropdownMenu>
                {/* No tooltip here: it would overwrite the trigger's data-state. */}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Opções do gráfico ${chart.name}`}>
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
          {onToggleCollapsed ? (
            // A folded card is just this bar: its way back stays visible.
            <div className={cn(!collapsed && REVEAL_ON_INTEREST)}>
              <IconAction
                label={collapsed ? "Mostrar gráfico" : "Recolher"}
                ariaLabel={collapsed ? `Mostrar o gráfico ${chart.name}` : `Recolher o gráfico ${chart.name}`}
                aria-expanded={!collapsed}
                aria-controls={collapsed ? undefined : bodyId}
                onClick={onToggleCollapsed}
              >
                {collapsed ? <ChevronDown /> : <ChevronUp />}
              </IconAction>
            </div>
          ) : null}
        </div>
      </div>
      {collapsed ? null : (
        <div id={bodyId} className="min-h-0 flex-1">
          <ChartRenderer chartType={chart.chartType} result={chart.result} lookups={lookups} />
        </div>
      )}
    </Card>
  );
}

// Icon-only buttons say what they do on hover too — not everyone reads icons.
function IconAction({
  label,
  ariaLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; ariaLabel: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={ariaLabel} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
