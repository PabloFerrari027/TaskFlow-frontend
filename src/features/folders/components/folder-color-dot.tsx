"use client";

import { useTheme } from "next-themes";
import type { FolderAppearanceCatalog } from "@/lib/appearance/catalog";
import { swatchFor } from "@/lib/appearance/catalog";
import catalogJson from "@/lib/appearance/folder-appearance-catalog.json";
import { useFolderAppearanceFlag } from "@/features/folders/hooks/use-folder-appearance-enabled";
import type { Folder } from "@/types/folder";

// JSON imports widen tuples (Oklch) to number[]; the shape is checked by catalog.test.ts.
const catalog = catalogJson as unknown as FolderAppearanceCatalog;

/** Small dot with the folder's effective palette color. Nothing for the default palette or when the flag is off. The local opt-out does not hide it (the dot only identifies). */
export function FolderColorDot({ folder }: { folder: Folder }) {
  const enabled = useFolderAppearanceFlag(folder.workspaceId);
  const { resolvedTheme } = useTheme();
  const paletteKey = folder.effectiveAppearance.paletteKey;
  if (!enabled || paletteKey === "default") return null;
  const color = swatchFor(paletteKey, resolvedTheme === "dark" ? "dark" : "light", catalog);
  if (!color) return null;
  return <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}
