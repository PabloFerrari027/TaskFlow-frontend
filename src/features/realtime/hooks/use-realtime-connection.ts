"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeService } from "@/features/realtime/api/realtime-service";
import { useOnlineStatus } from "@/features/sync/hooks/use-online-status";
import {
  invalidateByEntityChange,
  invalidateDerivedData,
} from "@/features/sync/lib/invalidate-entity";
import { pullChanges } from "@/features/sync/lib/sync-engine";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import type { RealtimeChangeMessage, RealtimeMessage } from "@/types/realtime";

// A bulk operation can emit dozens of change signals back to back; collecting
// them for a beat means each affected query refetches once, not once per
// signal (every `invalidateQueries` restarts an in-flight refetch).
const CHANGE_BATCH_MS = 150;

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

/**
 * Keeps one `EventSource` open for the current workspace and turns the
 * signals it receives into query invalidations. The channel is never a data
 * source — everything shown still comes from the normal REST refetch — and it
 * sits on top of the offline-first sync, whose 30s poll stays as the safety
 * net.
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
      if (changes.length > 0) invalidateDerivedData(queryClient);
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
      source?.close();
    };
  }, [queryClient, workspaceId, isOnline]);
}
