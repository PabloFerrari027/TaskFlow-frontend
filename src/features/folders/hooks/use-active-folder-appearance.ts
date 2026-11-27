"use client";

import * as React from "react";
import type { Folder } from "@/types/folder";
import { useFolderAppearanceContext } from "@/features/folders/context/folder-appearance-context";

/** Marks the folder as the one theming the main area while this route is shown. */
export function useActiveFolderAppearance(folder: Folder | undefined): void {
  const ctx = useFolderAppearanceContext();
  const activate = ctx?.activate;
  const release = ctx?.release;
  const folderId = folder?.id;
  const workspaceId = folder?.workspaceId;
  const eff = folder?.effectiveAppearance ?? null;

  React.useEffect(() => {
    if (!activate || !release || !folderId || !workspaceId) return;
    activate(folderId, workspaceId, eff);
    return () => release(folderId);
  }, [activate, release, folderId, workspaceId, eff]);
}
