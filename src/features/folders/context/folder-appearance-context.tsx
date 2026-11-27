"use client";

import * as React from "react";
import type { EffectiveFolderAppearance } from "@/types/folder-appearance";
import {
  nextActiveAppearance,
  type ActiveFolderAppearance,
} from "@/lib/appearance/scope";

interface FolderAppearanceContextValue {
  active: ActiveFolderAppearance | null;
  activate: (folderId: string, workspaceId: string, eff: EffectiveFolderAppearance | null) => void;
  release: (folderId: string) => void;
}

const FolderAppearanceContext = React.createContext<FolderAppearanceContextValue | null>(null);

// Only set inside the themed <main>: sidebar, topbar, tour and toasts keep
// portalling to <body> (undefined container) and stay on the default theme.
const FolderPortalContainerContext = React.createContext<HTMLElement | undefined>(undefined);

/** Tracks which folder the current route shows, for the themed main area. */
export function FolderAppearanceProvider({ children }: { children: React.ReactNode }) {
  const [active, dispatch] = React.useReducer(nextActiveAppearance, null);
  const pending = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const activate = React.useCallback(
    (folderId: string, workspaceId: string, eff: EffectiveFolderAppearance | null) => {
      const timer = pending.current.get(folderId);
      if (timer !== undefined) {
        clearTimeout(timer);
        pending.current.delete(folderId);
      }
      dispatch({ type: "activate", folderId, workspaceId, eff });
    },
    [],
  );

  // Deferred so a route that shows the same folder can re-activate it in the
  // same commit without a flash of the default theme.
  const release = React.useCallback((folderId: string) => {
    const previous = pending.current.get(folderId);
    if (previous !== undefined) clearTimeout(previous);
    pending.current.set(
      folderId,
      setTimeout(() => {
        pending.current.delete(folderId);
        dispatch({ type: "release", folderId });
      }, 0),
    );
  }, []);

  React.useEffect(() => {
    const timers = pending.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ active, activate, release }), [active, activate, release]);
  return <FolderAppearanceContext.Provider value={value}>{children}</FolderAppearanceContext.Provider>;
}

/** Null outside the provider, so callers degrade to the default theme. */
export function useFolderAppearanceContext(): FolderAppearanceContextValue | null {
  return React.useContext(FolderAppearanceContext);
}

export function FolderPortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | undefined;
  children: React.ReactNode;
}) {
  return (
    <FolderPortalContainerContext.Provider value={container}>{children}</FolderPortalContainerContext.Provider>
  );
}

/** Where Radix portals mount: the themed host inside a folder, else body (undefined). */
export function useFolderPortalContainer(): HTMLElement | undefined {
  return React.useContext(FolderPortalContainerContext);
}
