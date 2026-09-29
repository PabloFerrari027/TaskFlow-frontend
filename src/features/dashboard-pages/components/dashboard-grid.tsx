"use client";

import * as React from "react";
import ReactGridLayout, { useContainerWidth, verticalCompactor, type Layout } from "react-grid-layout";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { ChartExpandDialog } from "@/features/dashboard-pages/components/chart-expand-dialog";
import {
  ChartWidget,
  WIDGET_DRAG_HANDLE,
  WIDGET_NO_DRAG,
} from "@/features/dashboard-pages/components/chart-widget";
import { useCollapsedCharts } from "@/features/dashboard-pages/hooks/use-collapsed-charts";
import { GRID_COLUMNS } from "@/features/dashboard-pages/lib/chart-catalog";
import type { ChartPosition, ChartWithResult } from "@/types/dashboard-page";

const ROW_HEIGHT = 72;
const GAP = 16;
// A folded chart is one row tall: exactly its title bar (name + subtitle).
const COLLAPSED_ROWS = 1;
// Below this width 12 columns get too narrow to read or to drag precisely:
// charts stack full-width in saved order, and moving them is desktop-only.
const STACK_BELOW = 768;

export interface ChartPositionChange {
  chartId: string;
  position: ChartPosition;
}

function heightInPixels(rows: number) {
  return rows * ROW_HEIGHT + (rows - 1) * GAP;
}

/**
 * The page's chart grid. `editable` is the only switch: on, charts can be
 * dragged by their title bar and resized from the corner; off, the very same
 * widgets sit in the very same layout, just fixed in place — for viewers
 * without edit rights and for the anonymous public/guest viewer.
 *
 * Folding a chart is a per-viewer display choice (useCollapsedCharts), so
 * the grid keeps two layouts apart:
 * - the *shown* layout gives folded charts one row, and the grid's vertical
 *   compaction pulls everything below them up — no hole where the chart was;
 * - the *saved* layout is what the server has. Folding alone never reports
 *   anything; after a drag or resize, folded charts get their saved height
 *   back and the layout is compacted again before diffing, so what's saved
 *   is the layout as everyone else (with nothing folded) will see it.
 * Compaction only ever moves charts up, never reorders ones that share
 * columns, so re-inflating the folded ones restores the others' saved rows.
 */
export function DashboardGrid({
  pageId,
  charts,
  editable,
  lookups,
  onPositionsChange,
  onEditChart,
  onRemoveChart,
}: {
  pageId: string;
  charts: ChartWithResult[];
  editable: boolean;
  lookups?: ValueLabeler;
  onPositionsChange?: (changes: ChartPositionChange[]) => void;
  onEditChart?: (chart: ChartWithResult) => void;
  onRemoveChart?: (chart: ChartWithResult) => void;
}) {
  const { width, containerRef, mounted } = useContainerWidth();
  const chartIds = React.useMemo(() => charts.map((chart) => chart.id), [charts]);
  const { collapsed, toggle } = useCollapsedCharts(pageId, chartIds);
  // By id, so a refetch while it's open shows fresh data — and a chart
  // removed meanwhile simply closes the dialog.
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const expanded = charts.find((chart) => chart.id === expandedId) ?? null;

  const layout: Layout = React.useMemo(
    () =>
      charts.map((chart) => {
        const folded = collapsed.has(chart.id);
        return {
          i: chart.id,
          x: chart.position.x,
          y: chart.position.y,
          w: chart.position.width,
          h: folded ? COLLAPSED_ROWS : chart.position.height,
          minW: 2,
          minH: folded ? COLLAPSED_ROWS : 2,
          // Resizing a bar would save its folded height as the real one.
          isResizable: folded ? false : undefined,
        };
      }),
    [charts, collapsed]
  );

  // A drop or resize can also push *other* charts around (compaction), so
  // every chart whose box differs from what's saved is reported, not just
  // the one under the pointer.
  const reportChanges = React.useCallback(
    (shown: Layout) => {
      if (!onPositionsChange) return;
      const saved = new Map(charts.map((chart) => [chart.id, chart.position]));
      const next =
        collapsed.size === 0
          ? shown
          : verticalCompactor.compact(
              // Copies: the items handed to us belong to the grid's own state.
              shown.map((item) => ({
                ...item,
                h: collapsed.has(item.i) ? (saved.get(item.i)?.height ?? item.h) : item.h,
              })),
              GRID_COLUMNS
            );
      const changes: ChartPositionChange[] = [];
      for (const item of next) {
        const before = saved.get(item.i);
        if (!before) continue;
        if (
          before.x !== item.x ||
          before.y !== item.y ||
          before.width !== item.w ||
          before.height !== item.h
        ) {
          changes.push({
            chartId: item.i,
            position: { x: item.x, y: item.y, width: item.w, height: item.h },
          });
        }
      }
      if (changes.length > 0) onPositionsChange(changes);
    },
    [charts, collapsed, onPositionsChange]
  );

  const widget = (chart: ChartWithResult, draggable: boolean) => (
    <ChartWidget
      chart={chart}
      lookups={lookups}
      draggable={draggable}
      collapsed={collapsed.has(chart.id)}
      onToggleCollapsed={() => toggle(chart.id)}
      onExpand={() => setExpandedId(chart.id)}
      onEdit={onEditChart ? () => onEditChart(chart) : undefined}
      onRemove={onRemoveChart ? () => onRemoveChart(chart) : undefined}
    />
  );

  const stacked = width < STACK_BELOW;
  const ordered = React.useMemo(
    () =>
      [...charts].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x),
    [charts]
  );

  return (
    <div ref={containerRef} className="w-full">
      {!mounted ? null : stacked ? (
        <div className="flex flex-col gap-4">
          {ordered.map((chart) => (
            <div
              key={chart.id}
              // Folded, the card is as tall as its title bar needs.
              style={
                collapsed.has(chart.id) ? undefined : { height: heightInPixels(chart.position.height) }
              }
            >
              {widget(chart, false)}
            </div>
          ))}
        </div>
      ) : (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: GRID_COLUMNS,
            rowHeight: ROW_HEIGHT,
            margin: [GAP, GAP],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: editable,
            handle: `.${WIDGET_DRAG_HANDLE}`,
            cancel: `.${WIDGET_NO_DRAG}`,
          }}
          resizeConfig={{ enabled: editable }}
          onDragStop={(next) => reportChanges(next)}
          onResizeStop={(next) => reportChanges(next)}
        >
          {charts.map((chart) => (
            <div key={chart.id}>{widget(chart, editable)}</div>
          ))}
        </ReactGridLayout>
      )}

      <ChartExpandDialog
        chart={expanded}
        lookups={lookups}
        onOpenChange={(open) => !open && setExpandedId(null)}
      />
    </div>
  );
}
