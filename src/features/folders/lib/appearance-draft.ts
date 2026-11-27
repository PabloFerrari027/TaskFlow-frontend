import type { EffectiveFolderAppearance, FolderAppearanceKeys } from "@/types/folder-appearance";

const AXES = ["paletteKey", "fontKey", "weightKey"] as const;

/**
 * Only the axes that differ from the saved state. Sending the whole draft
 * would overwrite an axis someone else saved in the meantime. `null`
 * (inherit) and `'default'` (cut inheritance) are different values.
 */
export function diffAppearanceDraft(
  saved: FolderAppearanceKeys,
  draft: FolderAppearanceKeys
): Partial<FolderAppearanceKeys> {
  const patch: Partial<FolderAppearanceKeys> = {};
  for (const axis of AXES) {
    if (saved[axis] !== draft[axis]) patch[axis] = draft[axis];
  }
  return patch;
}

/**
 * Appearance a folder would show after a move: own axes win, null axes
 * inherit from the destination. A null destination is the root ('default').
 */
export function previewEffectiveAfterMove(
  own: FolderAppearanceKeys,
  destination: EffectiveFolderAppearance | null
): { paletteKey: string; fontKey: string; weightKey: string } {
  return {
    paletteKey: own.paletteKey ?? destination?.paletteKey ?? "default",
    fontKey: own.fontKey ?? destination?.fontKey ?? "default",
    weightKey: own.weightKey ?? destination?.weightKey ?? "default",
  };
}
