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

type PositionMap = Map<string, ChartPosition>;

function applyPositions(
  page: AuthenticatedDashboardPageView | undefined,
  positions: PositionMap
): AuthenticatedDashboardPageView | undefined {
  if (!page || positions.size === 0) return page;
  return {
    ...page,
    charts: page.charts.map((chart) => {
      const position = positions.get(chart.id);
      return position ? { ...chart, position } : chart;
    }),
  };
}

/**
 * Persists grid moves/resizes. The cache is updated right away (so the grid
 * never snaps back), while the PATCHes wait until ~500ms after the last
 * change — one request per chart that actually moved, never one per pixel.
 * A drag can also shift *other* charts (vertical compaction), which is why
 * this takes a batch.
 *
 * Batches are serialized: while one is in flight, newer changes wait and go
 * out after it settles, so an older PATCH can never land on top of a newer
 * one for the same chart. `confirmed` is the snapshot of what the server
 * holds for every chart touched since the last idle moment; a failed batch
 * drops everything unsent and puts the cache back on that snapshot — a
 * refetch alone could return the page's server-cached (up to 60s) layout.
 * Pending saves are flushed on unmount, not dropped.
 */
export function useChartPositionSaver(pageId: string) {
  const queryClient = useQueryClient();
  // Stable across renders: `flush` feeds the unmount effect, and a new key
  // every render would flush on every render instead of after the delay.
  const detailKey = React.useMemo(() => queryKeys.dashboardPages.detail(pageId), [pageId]);
  const confirmed = React.useRef<PositionMap>(new Map());
  const pending = React.useRef<PositionMap>(new Map());
  const inFlight = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    // The running loop below picks up whatever gets queued meanwhile.
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      while (pending.current.size > 0) {
        const batch: PositionMap = new Map(pending.current);
        pending.current.clear();

        const results = await Promise.allSettled(
          [...batch].map(async ([chartId, position]) => {
            await chartDefinitionsService.update(pageId, chartId, { position });
            confirmed.current.set(chartId, position);
          })
        );

        const failure = results.find((result) => result.status === "rejected");
        if (failure) {
          // Newer unsent moves were computed on top of the layout that just
          // failed; replaying them could leave charts overlapping. Back to
          // the server's layout instead, which the user can then rearrange.
          pending.current.clear();
          queryClient.setQueryData<AuthenticatedDashboardPageView>(detailKey, (page) =>
            applyPositions(page, confirmed.current)
          );
          toast.error(getErrorMessage((failure as PromiseRejectedResult).reason), {
            description: "O layout voltou para a última versão salva.",
          });
          break;
        }

        // A refetch that landed mid-save carries the pre-save positions; put
        // the intended layout (saved, then still-pending on top) back over it.
        const intended: PositionMap = new Map([...confirmed.current, ...pending.current]);
        queryClient.setQueryData<AuthenticatedDashboardPageView>(detailKey, (page) =>
          applyPositions(page, intended)
        );
      }
    } finally {
      // Idle again: the server is the source of truth for everything.
      confirmed.current.clear();
      inFlight.current = false;
    }
  }, [detailKey, pageId, queryClient]);

  const schedule = React.useCallback(
    (changes: { chartId: string; position: ChartPosition }[]) => {
      if (changes.length === 0) return;
      const byId: PositionMap = new Map(changes.map((change) => [change.chartId, change.position]));

      // Same as an onMutate: a refetch already under way would overwrite the
      // optimistic layout with the old one.
      void queryClient.cancelQueries({ queryKey: detailKey });
      const current = queryClient.getQueryData<AuthenticatedDashboardPageView>(detailKey);
      for (const chart of current?.charts ?? []) {
        if (byId.has(chart.id) && !confirmed.current.has(chart.id)) {
          confirmed.current.set(chart.id, chart.position);
        }
      }
      queryClient.setQueryData<AuthenticatedDashboardPageView>(detailKey, (page) =>
        applyPositions(page, byId)
      );

      for (const [chartId, position] of byId) pending.current.set(chartId, position);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [detailKey, flush, queryClient]
  );

  React.useEffect(
    () => () => {
      void flush();
    },
    [flush]
  );

  return schedule;
}
