import type { Mode, LightModeTokens, ModeTokens, StatusTokens } from "./contrast-pairs.ts";

// Same names as the backend catalog interface (folder-appearance-catalog.ts).
export interface PaletteDef {
  key: string;
  name: string;
  hue: number;
  neutralChroma: 0 | 1;
  light: LightModeTokens;
  dark: ModeTokens;
  swatch: { light: string; dark: string };
}

export interface FolderAppearanceCatalog {
  catalogVersion: number;
  contentHash: string;
  status: { light: StatusTokens; dark: StatusTokens };
  palettes: PaletteDef[];
  fonts: { key: string; name: string; category: "sans" | "serif" }[];
  weights: {
    key: string;
    name: string;
    medium: number;
    semibold: number;
    bold: number;
  }[];
}

/** sha256 hex of JSON.stringify of the catalog without its contentHash field. */
export async function computeContentHash(catalog: object): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(catalog));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Swatch color of a palette for the given mode, or null for an unknown key. */
export function swatchFor(
  paletteKey: string,
  mode: Mode,
  catalog: FolderAppearanceCatalog,
): string | null {
  return catalog.palettes.find((p) => p.key === paletteKey)?.swatch[mode] ?? null;
}
