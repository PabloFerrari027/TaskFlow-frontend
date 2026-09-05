"use client";

import * as React from "react";
import { useWorkspacesQuery } from "@/features/workspaces/hooks/use-workspaces";
import type { Workspace } from "@/types/workspace";

const STORAGE_KEY = "taskflow.currentWorkspaceId";

interface CurrentWorkspaceContextValue {
  workspaceId: string | null;
  workspace: Workspace | undefined;
  workspaces: Workspace[];
  isLoading: boolean;
  setWorkspaceId: (workspaceId: string) => void;
}

const CurrentWorkspaceContext =
  React.createContext<CurrentWorkspaceContextValue | null>(null);

export function CurrentWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const [workspaceId, setWorkspaceIdState] = React.useState<string | null>(
    null
  );
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        setWorkspaceIdState(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        // ignore unavailable storage
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  const setWorkspaceId = React.useCallback((id: string) => {
    setWorkspaceIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated || isLoading || workspaces.length === 0) return;
    const stillExists = workspaces.some((w) => w.id === workspaceId);
    if (!workspaceId || !stillExists) {
      Promise.resolve().then(() => setWorkspaceId(workspaces[0].id));
    }
  }, [hydrated, isLoading, workspaces, workspaceId, setWorkspaceId]);

  const workspace = workspaces.find((w) => w.id === workspaceId);

  const value = React.useMemo<CurrentWorkspaceContextValue>(
    () => ({
      workspaceId: workspace ? workspaceId : null,
      workspace,
      workspaces,
      isLoading: isLoading || !hydrated,
      setWorkspaceId,
    }),
    [workspace, workspaceId, workspaces, isLoading, hydrated, setWorkspaceId]
  );

  return (
    <CurrentWorkspaceContext.Provider value={value}>
      {children}
    </CurrentWorkspaceContext.Provider>
  );
}

export function useCurrentWorkspace() {
  const context = React.useContext(CurrentWorkspaceContext);
  if (!context) {
    throw new Error(
      "useCurrentWorkspace must be used within a CurrentWorkspaceProvider"
    );
  }
  return context;
}
