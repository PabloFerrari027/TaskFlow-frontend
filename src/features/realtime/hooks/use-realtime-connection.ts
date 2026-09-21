"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeService } from "@/features/realtime/api/realtime-service";
import { useOnlineStatus } from "@/features/sync/hooks/use-online-status";
import {
  invalidateByEntityChange,
  invalidateDerivedData,
} from "@/features/sync/lib/invalidate-entity";
import { pendingTaskMutations } from "@/features/tasks/lib/task-list-refresh";
import { setRealtimeConnected } from "@/features/realtime/lib/connection-state";
import { pullChanges } from "@/features/sync/lib/sync-engine";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import type { RealtimeChangeMessage, RealtimeMessage } from "@/types/realtime";

// A bulk operation can emit dozens of change signals back to back; collecting
// them for a beat means each affected query refetches once, not once per
// signal (every `invalidateQueries` restarts an in-flight refetch).
const CHANGE_BATCH_MS = 750;

// Activity and analytics are derived from every entity and are the heaviest
// refetches (an analytics page fans out into several queries), so they refresh
// at most this often no matter how many change batches arrive.
const DERIVED_REFRESH_MS = 3_000;

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

/**
 * Keeps one `EventSource` open for the current workspace and turns the
 * signals it receives into query invalidations. The channel is never a data
 * source — everything shown still comes from the normal REST refetch — and it
 * sits on top of the offline-first sync: while this channel is open the 30s
 * poll only advances the sync cursor, and once it drops the poll (plus the
 * pull on reconnect) invalidates again, so nothing missed stays stale.
 *
 * Reconnects are done by hand, not by the browser's built-in `EventSource`
 * retry: tickets are single-use, so the browser would re-request the same URL
 * with an already-consumed ticket, get a 401, and give up for good. Instead,
 * any error closes the source and asks for a fresh ticket after a backoff.
 */
export function useRealtimeConnection() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();
  const isOnline = useOnlineStatus();

  React.useEffect(() => {
    // Offline needs no special handling beyond not connecting — reconnection
    // is driven by this effect re-running once `isOnline` flips back.
    if (!workspaceId || !isOnline) return;

    let disposed = false;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let flushTimer: ReturnType<typeof setTimeout> | undefined;
    let derivedTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let hadError = false;
    let pulling: Promise<void> | null = null;
    const pending = new Map<string, RealtimeChangeMessage>();

    // The `sync` frame and the reconnect's `open` both ask for a pull within
    // the same tick — share one in-flight run instead of pulling twice.
    const pull = () => {
      if (pulling) return;
      pulling = pullChanges(queryClient, workspaceId)
        // Best effort: the periodic sync in `SyncProvider` retries it.
        .catch(() => undefined)
        .finally(() => {
          pulling = null;
        });
    };

    const flushChanges = () => {
      // A refetch now could answer from before this client's own pending task
      // writes and briefly bring back a deleted task or undo a move. Those
      // writes trigger a refresh of their own once they settle, which also
      // covers these signals — so just wait.
      if (pendingTaskMutations(queryClient) > 0) {
        flushTimer = setTimeout(flushChanges, CHANGE_BATCH_MS);
        return;
      }
      flushTimer = undefined;
      const changes = [...pending.values()];
      pending.clear();
      for (const change of changes) {
        invalidateByEntityChange(queryClient, {
          entityType: change.entityType,
          entityId: change.entityId,
          workspaceId: change.workspaceId,
        });
      }
      if (changes.length > 0) {
        // Throttle, not debounce: a steady stream of changes still refreshes
        // the derived views every `DERIVED_REFRESH_MS`.
        derivedTimer ??= setTimeout(() => {
          derivedTimer = undefined;
          invalidateDerivedData(queryClient);
        }, DERIVED_REFRESH_MS);
      }
    };

    const handleMessage = (raw: string) => {
      let message: Partial<RealtimeMessage> | null;
      try {
        message = JSON.parse(raw) as Partial<RealtimeMessage> | null;
      } catch {
        return;
      }

      if (message?.type === "sync") {
        pull();
      } else if (
        message?.type === "change" &&
        message.workspaceId === workspaceId &&
        message.entityType &&
        message.entityId
      ) {
        pending.set(`${message.entityType}:${message.entityId}`, message as RealtimeChangeMessage);
        flushTimer ??= setTimeout(flushChanges, CHANGE_BATCH_MS);
      }
    };

    const scheduleRetry = () => {
      if (disposed) return;
      const backoff = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
      attempt += 1;
      // Jitter, so every client dropped by a server restart doesn't come
      // back at the same instant.
      retryTimer = setTimeout(() => void connect(), backoff * (0.5 + Math.random() / 2));
    };

    const connect = async () => {
      let ticket: string;
      try {
        ({ ticket } = await realtimeService.requestTicket(workspaceId));
      } catch {
        scheduleRetry();
        return;
      }
      // The workspace changed (or the user left) while the ticket was in flight.
      if (disposed) return;

      const es = new EventSource(realtimeService.streamUrl(ticket));
      source = es;

      es.onopen = () => {
        attempt = 0;
        setRealtimeConnected(true);
        if (hadError) {
          hadError = false;
          // Covers anything missed while disconnected; redundant with the
          // `sync` frame the server sends on a new connection, on purpose.
          pull();
        }
      };
      es.onmessage = (event: MessageEvent<string>) => handleMessage(event.data);
      es.onerror = () => {
        hadError = true;
        setRealtimeConnected(false);
        es.close();
        if (source === es) source = null;
        scheduleRetry();
      };
    };

    void connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearTimeout(flushTimer);
      clearTimeout(derivedTimer);
      setRealtimeConnected(false);
      source?.close();
    };
  }, [queryClient, workspaceId, isOnline]);
}
