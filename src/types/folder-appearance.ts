// Mirrors the backend contract (folder appearance themes). Keys come from the catalog JSON.
export interface FolderAppearanceKeys {
  paletteKey: string | null;
  fontKey: string | null;
  weightKey: string | null;
}

export type FolderAppearanceSource = "self" | "ancestor" | "default";

export interface EffectiveFolderAppearance {
  paletteKey: string;
  fontKey: string;
  weightKey: string;
  source: {
    palette: FolderAppearanceSource;
    font: FolderAppearanceSource;
    weight: FolderAppearanceSource;
  };
  // Only present for readers with a role in the workspace.
  sourceFolderId?: {
    palette: string | null;
    font: string | null;
    weight: string | null;
  };
  catalogVersion: number;
}

// Must match the font keys of the catalog JSON (guarded by a unit test).
export const FOLDER_FONT_KEYS = ["default", "inter", "nunito", "lexend", "atkinson", "source-serif"] as const;
export type FolderFontKey = (typeof FOLDER_FONT_KEYS)[number];
