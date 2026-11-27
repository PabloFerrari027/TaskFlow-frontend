import type { Oklch } from "./color-math.ts";
import {
  TOKEN_NAMES,
  type Mode,
  type ModeTokens,
  type StatusTokens,
  type TokenName,
} from "./contrast-pairs.ts";

export type ThemeBlock = Record<string, Oklch>;

const OKLCH_DECL = /--([\w-]+)\s*:\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)\s*;/g;

function blockBody(css: string, selector: RegExp): string {
  const match = selector.exec(css);
  if (!match) throw new Error(`block not found: ${selector}`);
  const start = css.indexOf("{", match.index) + 1;
  let depth = 1;
  let i = start;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(start, i - 1);
}

function parseBlock(body: string): ThemeBlock {
  const out: ThemeBlock = {};
  // Declarations with an alpha ("/") or a non-OKLCH value do not match.
  for (const m of body.matchAll(OKLCH_DECL)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return out;
}

/** Reads `--name: oklch(L C h)` declarations from `:root {…}` and `.dark {…}`. */
export function parseThemeBlocks(css: string): { light: ThemeBlock; dark: ThemeBlock } {
  return {
    light: parseBlock(blockBody(css, /(^|\n):root\s*\{/)),
    dark: parseBlock(blockBody(css, /(^|\n)\.dark\s*\{/)),
  };
}

const CSS_NAME: Record<TokenName, string> = {
  primary: "primary",
  primaryForeground: "primary-foreground",
  primaryHover: "primary-hover",
  ring: "ring",
  chart1: "chart-1",
  accent: "accent",
  accentForeground: "accent-foreground",
  background: "background",
  foreground: "foreground",
  card: "card",
  cardForeground: "card-foreground",
  popover: "popover",
  popoverForeground: "popover-foreground",
  secondary: "secondary",
  secondaryForeground: "secondary-foreground",
  muted: "muted",
  mutedForeground: "muted-foreground",
};

function need(block: ThemeBlock, name: string, mode: Mode): Oklch {
  const v = block[name];
  if (!v) throw new Error(`missing --${name} in ${mode} block`);
  return v;
}

export function toModeTokens(
  block: ThemeBlock,
  mode: Mode,
): { tokens: ModeTokens; status: StatusTokens } {
  const tokens = {} as ModeTokens;
  for (const name of TOKEN_NAMES) tokens[name] = need(block, CSS_NAME[name], mode);
  return {
    tokens,
    status: {
      destructive: need(block, "destructive", mode),
      success: need(block, "success", mode),
      successForeground: need(block, "success-foreground", mode),
    },
  };
}
