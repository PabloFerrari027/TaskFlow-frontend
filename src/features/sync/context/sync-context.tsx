"use client";

import * as React from "react";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isRealtimeConnected } from "@/features/realtime/lib/connection-state";
import { useOnlineStatus } from "@/features/sync/hooks/use-online-status";
import { useOutboxCount } from "@/features/sync/hooks/use-outbox-count";
import { flushOutbox, pullChanges } from "@/features/sync/lib/sync-engine";

interface SyncContextValue {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => void;
}

const SyncContext = React.createContext<SyncContextValue | null>(null);

// Background safety net in case a push/pull silently fails to reschedule
// itself (e.g. a tab that never re-fires the `online` event) — actual
// syncing is normally triggered by connectivity changes, not this timer.
const SYNC_INTERVAL_MS = 30_000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const pendingCount = useOutboxCount();
  const { workspaceId } = useCurrentWorkspace();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const syncingRef = React.useRef(false);

  const runSync = React.useCallback(async ({ background = false } = {}) => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await flushOutbox(queryClient);
      if (workspaceId) {
        // While realtime is open it already invalidates on every change, so
        // the background poll just keeps the cursor current.
        await pullChanges(queryClient, workspaceId, {
          invalidate: !(background && isRealtimeConnected()),
        });
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [queryClient, workspaceId]);

  React.useEffect(() => {
    if (isOnline) void runSync();
  }, [isOnline, runSync]);

  React.useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(() => void runSync({ background: true }), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isOnline, runSync]);

  // Ask for confirmation before a refresh/close/external navigation while
  // writes are still queued in the outbox or in flight, so they aren't cut
  // off mid-request. Browsers show their own generic text for this prompt.
  const activeMutations = useIsMutating();
  const hasPendingWork = pendingCount > 0 || activeMutations > 0;

  React.useEffect(() => {
    if (!hasPendingWork) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers require returnValue to be set to trigger the prompt.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasPendingWork]);

  const value = React.useMemo<SyncContextValue>(
    () => ({ isOnline, pendingCount, isSyncing, syncNow: () => void runSync() }),
    [isOnline, pendingCount, isSyncing, runSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = React.useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
