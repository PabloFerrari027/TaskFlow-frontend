// origem: TaskFlow-backend/src/modules/folders/domain/appearance/contrast-pairs.ts
// The front lands before the backend, so THIS file is the origin of the pairs;
// the backend copies it to the path above. Pairs and alphas follow spec 4.3 (A1-A9, S1-S3).
import {
  composite,
  contrastRatio,
  type Oklch,
  type Rgb,
  toSrgbGamma,
} from "./color-math.ts";

export type Mode = "light" | "dark";

export const TOKEN_NAMES = [
  "primary",
  "primaryForeground",
  "primaryHover",
  "ring",
  "chart1",
  "accent",
  "accentForeground",
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];
export type ModeTokens = Record<TokenName, Oklch>;
/** Light mode also carries border and input per palette; dark keeps them fixed (white with alpha). */
export type LightModeTokens = ModeTokens & { border: Oklch; input: Oklch };

/** Global state colors: identical in every palette, tested against each palette's neutrals. */
export interface StatusTokens {
  destructive: Oklch;
  success: Oklch;
  successForeground: Oklch;
}

export interface ContrastViolation {
  pair: string;
  ratio: number;
  min: number;
}

const TEXT_MIN = 4.5;
const UI_MIN = 3.0;

type Surface = "background" | "card" | "popover" | "muted";

export function contrastViolations(
  t: ModeTokens,
  s: StatusTokens,
  mode: Mode,
): ContrastViolation[] {
  const violations: ContrastViolation[] = [];
  const rgb = (c: Oklch): Rgb => toSrgbGamma(c);
  const surface = (name: Surface): Rgb => rgb(t[name]);

  const check = (pair: string, fg: Rgb, bg: Rgb, min: number): void => {
    const ratio = contrastRatio(fg, bg);
    if (ratio < min) violations.push({ pair, ratio, min });
  };

  // "token/NN@surface": token tinted with alpha NN% over the surface.
  const alphaPct = (a: number): string => String(Math.round(a * 100));

  const on = (
    code: string,
    fgName: string,
    fg: Oklch,
    surfaces: Surface[],
    min: number,
  ): void => {
    for (const sf of surfaces) check(`${code}:${fgName}@${sf}`, rgb(fg), surface(sf), min);
  };

  const onTint = (
    code: string,
    name: string,
    color: Oklch,
    alpha: number,
    surfaces: Surface[],
    min: number,
  ): void => {
    for (const sf of surfaces) {
      const tinted = composite(rgb(color), alpha, surface(sf));
      check(`${code}:${name}/${alphaPct(alpha)}@${sf}`, rgb(color), tinted, min);
    }
  };

  const fgSurfaces: Surface[] = ["background", "card", "popover"];

  // A1/A2: text on solid primary and its hover.
  check("A1:primaryForeground@primary", rgb(t.primaryForeground), rgb(t.primary), TEXT_MIN);
  check("A2:primaryForeground@primaryHover", rgb(t.primaryForeground), rgb(t.primaryHover), TEXT_MIN);
  // A3/A4: primary as text and on its own 10% tint.
  on("A3", "primary", t.primary, fgSurfaces, TEXT_MIN);
  onTint("A4", "primary", t.primary, 0.1, fgSurfaces, TEXT_MIN);
  // A5, A8: soft accent and secondary button.
  check("A5:accentForeground@accent", rgb(t.accentForeground), rgb(t.accent), TEXT_MIN);
  check("A8:secondaryForeground@secondary", rgb(t.secondaryForeground), rgb(t.secondary), TEXT_MIN);
  // A6/A7: body and secondary text.
  on("A6", "foreground", t.foreground, fgSurfaces, TEXT_MIN);
  on("A7", "mutedForeground", t.mutedForeground, ["background", "card", "muted"], TEXT_MIN);
  // A9: opaque focus ring (non-text, 3:1).
  on("A9", "ring", t.ring, ["background", "card", "muted"], UI_MIN);

  // S1: destructive on its tint (light /10,/20; dark /20,/30).
  const s1Alphas = mode === "light" ? [0.1, 0.2] : [0.2, 0.3];
  for (const a of s1Alphas) onTint("S1", "destructive", s.destructive, a, ["background", "card"], TEXT_MIN);
  // S2: destructive text.
  on("S2", "destructive", s.destructive, ["background", "card"], TEXT_MIN);
  // S3: success badge text, success text, success on its 10% tint.
  check("S3:successForeground@success", rgb(s.successForeground), rgb(s.success), TEXT_MIN);
  on("S3", "success", s.success, ["background", "card"], TEXT_MIN);
  onTint("S3", "success", s.success, 0.1, ["background"], TEXT_MIN);

  return violations;
}
