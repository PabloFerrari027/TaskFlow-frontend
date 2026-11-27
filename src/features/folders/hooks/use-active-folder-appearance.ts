"use client";

import * as React from "react";
import type { Folder } from "@/types/folder";
import { useFolderAppearanceContext } from "@/features/folders/context/folder-appearance-context";

/**
 * Marks the route's folder as the one theming the main area while it is
 * shown. While its data loads the previous appearance is kept (pending), so
 * switching folders never flashes the default theme.
 */
export function useActiveFolderAppearance(folderId: string, folder: Folder | undefined): void {
  const ctx = useFolderAppearanceContext();
  const activate = ctx?.activate;
  const pend = ctx?.pend;
  const release = ctx?.release;
  const loaded = folder?.id === folderId ? folder : undefined;
  const workspaceId = loaded?.workspaceId;
  const eff = loaded?.effectiveAppearance ?? null;

  React.useEffect(() => {
    if (!activate || !pend || !release || !folderId) return;
    if (workspaceId) activate(folderId, workspaceId, eff);
    else pend(folderId);
    return () => release(folderId);
  }, [activate, pend, release, folderId, workspaceId, eff]);
}
