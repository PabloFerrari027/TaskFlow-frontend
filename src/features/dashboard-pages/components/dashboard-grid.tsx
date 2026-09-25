"use client";

import * as React from "react";
import ReactGridLayout, { useContainerWidth, type Layout } from "react-grid-layout";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import {
  ChartWidget,
  WIDGET_DRAG_HANDLE,
  WIDGET_NO_DRAG,
} from "@/features/dashboard-pages/components/chart-widget";
import { GRID_COLUMNS } from "@/features/dashboard-pages/lib/chart-catalog";
import type { ChartPosition, ChartWithResult } from "@/types/dashboard-page";

const ROW_HEIGHT = 72;
const GAP = 16;
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
 */
export function DashboardGrid({
  charts,
  editable,
  lookups,
  onPositionsChange,
  onEditChart,
  onRemoveChart,
}: {
  charts: ChartWithResult[];
  editable: boolean;
  lookups?: ValueLabeler;
  onPositionsChange?: (changes: ChartPositionChange[]) => void;
  onEditChart?: (chart: ChartWithResult) => void;
  onRemoveChart?: (chart: ChartWithResult) => void;
}) {
  const { width, containerRef, mounted } = useContainerWidth();

  const layout: Layout = React.useMemo(
    () =>
      charts.map((chart) => ({
        i: chart.id,
        x: chart.position.x,
        y: chart.position.y,
        w: chart.position.width,
        h: chart.position.height,
        minW: 2,
        minH: 2,
      })),
    [charts]
  );

  // A drop or resize can also push *other* charts around (compaction), so
  // every chart whose box differs from what's saved is reported, not just
  // the one under the pointer.
  const reportChanges = React.useCallback(
    (next: Layout) => {
      if (!onPositionsChange) return;
      const saved = new Map(charts.map((chart) => [chart.id, chart.position]));
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
    [charts, onPositionsChange]
  );

  const widget = (chart: ChartWithResult, draggable: boolean) => (
    <ChartWidget
      chart={chart}
      lookups={lookups}
      draggable={draggable}
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
              style={{ height: heightInPixels(chart.position.height) }}
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
    </div>
  );
}
