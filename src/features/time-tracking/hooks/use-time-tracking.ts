"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timeTrackingService } from "@/features/time-tracking/api/time-tracking-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type {
  LogTimeEntryRequest,
  TimeEntry,
  TimeReportGroupBy,
  UpdateTimeEntryRequest,
} from "@/types/time-tracking";

/** The signed-in user's running timer (at most one), or `null`. */
export function useRunningTimerQuery() {
  return useQuery({
    queryKey: queryKeys.timeTracking.running(),
    queryFn: () => timeTrackingService.running(),
    // Another tab or device may start/stop it.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Seconds on a running entry, ticking every second from the server's count. */
export function useElapsedSeconds(entry: TimeEntry | null | undefined) {
  const [now, setNow] = React.useState(() => Date.now());
  const [fetchedAt, setFetchedAt] = React.useState(() => Date.now());
  const running = !!entry?.running;

  // Re-anchor whenever the server sends a fresh copy of the entry.
  React.useEffect(() => {
    const at = Date.now();
    Promise.resolve().then(() => {
      setFetchedAt(at);
      setNow(at);
    });
  }, [entry]);

  React.useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (!entry) return 0;
  return running ? entry.durationSeconds + Math.max(0, Math.floor((now - fetchedAt) / 1000)) : entry.durationSeconds;
}

function useInvalidateTime() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.timeTracking.root() });
}

export function useStartTimerMutation() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTime();

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => timeTrackingService.start(itemId),
    onSuccess: ({ running, stopped }) => {
      queryClient.setQueryData(queryKeys.timeTracking.running(), running);
      invalidate();
      toast.success(
        stopped ? "Cronômetro trocado para este item (o anterior foi parado e salvo)." : "Cronômetro iniciado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useStopTimerMutation() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTime();

  return useMutation({
    mutationFn: () => timeTrackingService.stop(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.timeTracking.running(), null);
      invalidate();
      toast.success("Tempo salvo.");
    },
    onError: (error) => {
      // Stopped elsewhere already: just catch up.
      invalidate();
      toast.error(getErrorMessage(error));
    },
  });
}

export function useItemTimeEntriesQuery(itemId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.timeTracking.item(itemId, page),
    queryFn: () => timeTrackingService.listForItem(itemId, { page, limit: 10 }),
    placeholderData: keepPreviousData,
  });
}

export function useLogTimeEntryMutation(itemId: string) {
  const invalidate = useInvalidateTime();

  return useMutation({
    mutationFn: (payload: LogTimeEntryRequest) => timeTrackingService.log(itemId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Tempo registrado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTimeEntryMutation() {
  const invalidate = useInvalidateTime();

  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: UpdateTimeEntryRequest }) =>
      timeTrackingService.update(entryId, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteTimeEntryMutation() {
  const invalidate = useInvalidateTime();

  return useMutation({
    mutationFn: (entryId: string) => timeTrackingService.remove(entryId),
    onSuccess: () => {
      invalidate();
      toast.success("Registro apagado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useFolderTimeReportQuery(folderId: string, groupBy: TimeReportGroupBy, from?: string) {
  return useQuery({
    queryKey: queryKeys.timeTracking.report(folderId, { groupBy, from }),
    queryFn: () => timeTrackingService.report(folderId, { groupBy, from }),
    placeholderData: keepPreviousData,
  });
}
