import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { isInGamut } from "../lib/appearance/color-math.ts";
import { contrastViolations } from "../lib/appearance/contrast-pairs.ts";
import {
  parseThemeBlocks,
  toModeTokens,
} from "../lib/appearance/globals-tokens.ts";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const blocks = parseThemeBlocks(css);

test("default theme has no contrast violation in light and dark", () => {
  for (const mode of ["light", "dark"] as const) {
    const { tokens, status } = toModeTokens(blocks[mode], mode);
    const violations = contrastViolations(tokens, status, mode);
    assert.deepEqual(violations, [], `${mode}: ${JSON.stringify(violations)}`);
  }
});

test("every oklch token in :root and .dark is inside sRGB", () => {
  const outside: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    for (const [name, value] of Object.entries(blocks[mode])) {
      if (!isInGamut(value)) outside.push(`${mode} ${name} oklch(${value.join(" ")})`);
    }
  }
  assert.deepEqual(outside, [], `out of gamut: ${outside.join("; ")}`);
});
