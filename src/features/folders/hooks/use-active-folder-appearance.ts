"use client";

import * as React from "react";
import type { Folder } from "@/types/folder";
import { FOLDER_FONTS } from "@/lib/appearance/folder-fonts";
import type { FolderFontKey } from "@/types/folder-appearance";
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

  const fontKey = eff?.fontKey as FolderFontKey | undefined;

  // Warm the font file as soon as a non-default font is known; never awaited.
  React.useEffect(() => {
    if (!fontKey || fontKey === "default" || !(fontKey in FOLDER_FONTS)) return;
    if (typeof document === "undefined" || !document.fonts) return;
    void document.fonts.load(`600 1em ${FOLDER_FONTS[fontKey].style.fontFamily}`);
  }, [fontKey]);

  React.useEffect(() => {
    if (!activate || !pend || !release || !folderId) return;
    if (workspaceId) activate(folderId, workspaceId, eff);
    else pend(folderId);
    return () => release(folderId);
  }, [activate, pend, release, folderId, workspaceId, eff]);
}
