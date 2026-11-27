import type { FolderAppearanceCatalog } from "@/lib/appearance/catalog";
import type { Mode } from "@/lib/appearance/contrast-pairs";
import type { EffectiveFolderAppearance, FolderAppearanceKeys } from "@/types/folder-appearance";
import { previewEffectiveAfterMove } from "./appearance-draft.ts";

export type AppearanceAxis = "palette" | "font" | "weight";
export const APPEARANCE_AXES: readonly AppearanceAxis[] = ["palette", "font", "weight"];
export const AXIS_KEY = { palette: "paletteKey", font: "fontKey", weight: "weightKey" } as const;

export type ResolvedAppearance = { paletteKey: string; fontKey: string; weightKey: string };

export interface AppearanceFolderLike {
  id: string;
  parentId: string | null;
  appearance: FolderAppearanceKeys;
  effectiveAppearance: EffectiveFolderAppearance;
}

export interface InheritedAxis {
  value: string;
  label: string;
}

export type InheritedAppearance = Record<AppearanceAxis, InheritedAxis>;

const ROOT_LABEL = "Padrão do TaskFlow";
const INHERIT_LABEL = "Igual à pasta acima";

function inheritLabel(sourceId: string | null | undefined, nameOf: (id: string) => string | undefined): string {
  const name = sourceId ? nameOf(sourceId) : undefined;
  return name ? `${INHERIT_LABEL} (${name})` : INHERIT_LABEL;
}

/**
 * What each axis would be if the folder inherited it ("null" option), with
 * the option label. An axis already inherited reads the folder's own effective
 * value; an axis set on the folder reads the parent's effective value. The
 * source folder name is shown only when the API gave its id and it is cached.
 */
export function inheritedAppearance(
  folder: AppearanceFolderLike,
  parent: AppearanceFolderLike | undefined,
  nameOf: (id: string) => string | undefined,
): InheritedAppearance {
  const out = {} as InheritedAppearance;
  for (const axis of APPEARANCE_AXES) {
    const key = AXIS_KEY[axis];
    if (folder.parentId === null) {
      out[axis] = { value: "default", label: ROOT_LABEL };
    } else if (folder.appearance[key] === null) {
      const eff = folder.effectiveAppearance;
      out[axis] = { value: eff[key], label: inheritLabel(eff.sourceFolderId?.[axis], nameOf) };
    } else if (parent) {
      const eff = parent.effectiveAppearance;
      const sourceId = eff.source[axis] === "default" ? null : eff.sourceFolderId?.[axis];
      out[axis] = { value: eff[key], label: inheritLabel(sourceId, nameOf) };
    } else {
      out[axis] = { value: "default", label: INHERIT_LABEL };
    }
  }
  return out;
}

/** The appearance a draft shows: own axes win, null axes take the inherited value. */
export function resolveDraft(draft: FolderAppearanceKeys, inherited: InheritedAppearance): ResolvedAppearance {
  return {
    paletteKey: draft.paletteKey ?? inherited.palette.value,
    fontKey: draft.fontKey ?? inherited.font.value,
    weightKey: draft.weightKey ?? inherited.weight.value,
  };
}

/** Read-only origin of an axis, e.g. "Igual à pasta Clientes". */
export function sourceLabel(
  eff: EffectiveFolderAppearance,
  axis: AppearanceAxis,
  nameOf: (id: string) => string | undefined,
): string {
  const source = eff.source[axis];
  if (source === "self") return "Definida nesta pasta";
  if (source === "default") return ROOT_LABEL;
  const id = eff.sourceFolderId?.[axis];
  const name = id ? nameOf(id) : undefined;
  return name ? `Igual à pasta ${name}` : INHERIT_LABEL;
}

/** Notice shown before a move when the folder's effective appearance would change; null otherwise. */
export function moveAppearanceNotice(
  folder: AppearanceFolderLike,
  destination: EffectiveFolderAppearance | null,
  destinationName: string,
): string | null {
  const after = previewEffectiveAfterMove(folder.appearance, destination);
  const now = folder.effectiveAppearance;
  const changed =
    after.paletteKey !== now.paletteKey || after.fontKey !== now.fontKey || after.weightKey !== now.weightKey;
  return changed ? `A aparência desta pasta vai seguir a de “${destinationName}”.` : null;
}

// Same naming as css-generator.ts (chart1 -> chart-1, primaryHover -> primary-hover).
const kebab = (name: string): string =>
  name.replace(/([a-z])(\d)/g, "$1-$2").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const oklch = (v: readonly number[]): string => `oklch(${v[0]} ${v[1]} ${v[2]})`;

/**
 * Inline custom properties that bring default axes back inside the preview.
 * The preview sits inside the themed <main>, so an axis without attribute
 * would show the saved folder appearance instead of the default one.
 * `rootFontSans` is the app's own --font-sans read from <html>.
 */
export function previewResetStyle(
  resolved: ResolvedAppearance,
  catalog: FolderAppearanceCatalog,
  mode: Mode,
  rootFontSans: string,
): Record<string, string> {
  const style: Record<string, string> = {};
  const isDefault = (list: { key: string }[], key: string) =>
    key === "default" || !list.some((x) => x.key === key);

  const palette = catalog.palettes.find((p) => p.key === "default");
  if (palette && isDefault(catalog.palettes, resolved.paletteKey)) {
    for (const [name, value] of Object.entries(palette[mode] as Record<string, readonly number[]>)) {
      style[`--${kebab(name)}`] = oklch(value);
    }
    if (mode === "light") {
      const h = palette.hue;
      style["--shadow-card"] = `0 1px 2px oklch(0.25 0.03 ${h} / 0.04), 0 2px 10px -3px oklch(0.25 0.03 ${h} / 0.07)`;
      style["--shadow-card-hover"] = `0 2px 4px oklch(0.25 0.03 ${h} / 0.05), 0 10px 24px -8px oklch(0.25 0.03 ${h} / 0.16)`;
    }
  }

  if (rootFontSans && isDefault(catalog.fonts, resolved.fontKey)) {
    style["--font-sans"] = rootFontSans;
    style.fontFamily = "var(--font-sans)";
  }

  const weight = catalog.weights.find((w) => w.key === "default");
  if (weight && isDefault(catalog.weights, resolved.weightKey)) {
    style["--font-weight-medium"] = String(weight.medium);
    style["--font-weight-semibold"] = String(weight.semibold);
    style["--font-weight-bold"] = String(weight.bold);
  }
  return style;
}
