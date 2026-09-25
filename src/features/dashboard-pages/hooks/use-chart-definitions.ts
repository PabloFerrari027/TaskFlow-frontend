"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chartDefinitionsService } from "@/features/dashboard-pages/api/dashboard-pages-service";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type {
  AuthenticatedDashboardPageView,
  ChartDefinitionRequest,
  ChartPosition,
} from "@/types/dashboard-page";

// Creating or editing a chart changes its query, so the page is refetched to
// get the freshly executed result — the write endpoints return no result.
export function useCreateChartMutation(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChartDefinitionRequest) =>
      chartDefinitionsService.create(pageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.detail(pageId) });
      toast.success("Gráfico adicionado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateChartMutation(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chartId, payload }: { chartId: string; payload: Partial<ChartDefinitionRequest> }) =>
      chartDefinitionsService.update(pageId, chartId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.detail(pageId) });
      toast.success("Gráfico atualizado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteChartMutation(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chartId: string) => chartDefinitionsService.remove(pageId, chartId),
    onSuccess: (_data, chartId) => {
      queryClient.setQueryData<AuthenticatedDashboardPageView>(
        queryKeys.dashboardPages.detail(pageId),
        (page) => page && { ...page, charts: page.charts.filter((c) => c.id !== chartId) }
      );
      toast.success("Gráfico removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

const SAVE_DELAY_MS = 500;

/**
 * Persists grid moves/resizes. The cache is updated right away (so the grid
 * never snaps back), while the PATCHes wait until ~500ms after the last
 * change — one request per chart that actually moved, never one per pixel.
 * A drag can also shift *other* charts (vertical compaction), which is why
 * this takes a batch. Pending saves are flushed on unmount, not dropped.
 */
export function useChartPositionSaver(pageId: string) {
  const queryClient = useQueryClient();
  const pending = React.useRef(new Map<string, ChartPosition>());
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const batch = [...pending.current.entries()];
    pending.current.clear();
    if (batch.length === 0) return;

    Promise.all(
      batch.map(([chartId, position]) =>
        chartDefinitionsService.update(pageId, chartId, { position })
      )
    ).catch((error) => {
      toast.error(getErrorMessage(error));
      // Back to whatever the server actually holds.
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.detail(pageId) });
    });
  }, [pageId, queryClient]);

  const schedule = React.useCallback(
    (changes: { chartId: string; position: ChartPosition }[]) => {
      if (changes.length === 0) return;
      const byId = new Map(changes.map((change) => [change.chartId, change.position]));

      queryClient.setQueryData<AuthenticatedDashboardPageView>(
        queryKeys.dashboardPages.detail(pageId),
        (page) =>
          page && {
            ...page,
            charts: page.charts.map((chart) => {
              const position = byId.get(chart.id);
              return position ? { ...chart, position } : chart;
            }),
          }
      );

      for (const [chartId, position] of byId) pending.current.set(chartId, position);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush, pageId, queryClient]
  );

  React.useEffect(() => flush, [flush]);

  return schedule;
}
