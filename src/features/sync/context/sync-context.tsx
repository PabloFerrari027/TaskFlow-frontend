"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
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

  const runSync = React.useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await flushOutbox(queryClient);
      if (workspaceId) {
        await pullChanges(queryClient, workspaceId);
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
    const id = setInterval(() => void runSync(), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isOnline, runSync]);

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
