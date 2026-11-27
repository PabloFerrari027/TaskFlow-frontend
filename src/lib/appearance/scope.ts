import type { EffectiveFolderAppearance } from "../../types/folder-appearance.ts";
import type { FolderAppearanceCatalog } from "./catalog.ts";

export interface ScopeAttributes {
  "data-folder-palette"?: string;
  "data-folder-font"?: string;
  "data-folder-weight"?: string;
}

function known(list: { key: string }[], key: string): boolean {
  return key !== "default" && list.some((x) => x.key === key);
}

/** Scope attributes for non-default axes only; unknown keys are ignored. */
export function toScopeAttributes(
  eff: EffectiveFolderAppearance | null,
  catalog: FolderAppearanceCatalog,
): ScopeAttributes {
  const out: ScopeAttributes = {};
  if (!eff) return out;
  if (known(catalog.palettes, eff.paletteKey)) out["data-folder-palette"] = eff.paletteKey;
  if (known(catalog.fonts, eff.fontKey)) out["data-folder-font"] = eff.fontKey;
  if (known(catalog.weights, eff.weightKey)) out["data-folder-weight"] = eff.weightKey;
  return out;
}

export {
  readIgnoreFolderAppearance,
  writeIgnoreFolderAppearance,
} from "../../features/folders/lib/folder-appearance-pref.ts";

export interface ActiveFolderAppearance {
  folderId: string;
  workspaceId: string;
  eff: EffectiveFolderAppearance | null;
  // Folder whose route is shown but still loading; the current appearance is
  // kept until it activates, so the default theme never flashes in between.
  pendingFolderId?: string;
}

export type ActiveAppearanceEvent =
  | ({ type: "activate" } & Omit<ActiveFolderAppearance, "pendingFolderId">)
  | { type: "pending"; folderId: string }
  | { type: "release"; folderId: string };

/**
 * Which folder themes the main area. Activating replaces. A pending folder
 * (route shown, data loading) keeps the current appearance. Releasing the
 * active folder clears it unless another folder is pending; releasing the
 * pending folder means folders were left, so it clears too. Any other
 * release is a late one from a previous route and is ignored.
 */
export function nextActiveAppearance(
  current: ActiveFolderAppearance | null,
  event: ActiveAppearanceEvent,
): ActiveFolderAppearance | null {
  if (event.type === "activate") {
    const { folderId, workspaceId, eff } = event;
    return { folderId, workspaceId, eff };
  }
  if (!current) return null;
  const pending = current.pendingFolderId;
  if (event.type === "pending") {
    if (event.folderId === current.folderId || event.folderId === pending) return current;
    return { ...current, pendingFolderId: event.folderId };
  }
  if (event.folderId === pending) return null;
  if (event.folderId === current.folderId) return pending ? current : null;
  return current;
}
