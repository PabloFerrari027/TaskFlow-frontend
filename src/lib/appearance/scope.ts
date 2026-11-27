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
}

export type ActiveAppearanceEvent =
  | ({ type: "activate" } & ActiveFolderAppearance)
  | { type: "release"; folderId: string };

/**
 * Which folder themes the main area. Activating replaces; releasing only
 * clears when it is the active folder, so a late release from the previous
 * route never wipes the folder the next route just activated.
 */
export function nextActiveAppearance(
  current: ActiveFolderAppearance | null,
  event: ActiveAppearanceEvent,
): ActiveFolderAppearance | null {
  if (event.type === "activate") {
    const { folderId, workspaceId, eff } = event;
    return { folderId, workspaceId, eff };
  }
  return current?.folderId === event.folderId ? null : current;
}
