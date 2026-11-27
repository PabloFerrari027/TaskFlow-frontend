import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Oklch } from "./color-math.ts";
import {
  contrastViolations,
  type LightModeTokens,
  type ModeTokens,
  type StatusTokens,
} from "./contrast-pairs.ts";

// Corrected default light theme (spec 4.3), with the destructive overridden per test.
const light: LightModeTokens = {
  background: [0.982, 0.005, 275],
  foreground: [0.21, 0.022, 275],
  card: [1, 0, 0],
  cardForeground: [0.21, 0.022, 275],
  popover: [1, 0, 0],
  popoverForeground: [0.21, 0.022, 275],
  primary: [0.535, 0.225, 275],
  primaryForeground: [0.985, 0, 0],
  primaryHover: [0.495, 0.225, 275],
  secondary: [0.955, 0.009, 275],
  secondaryForeground: [0.25, 0.03, 275],
  muted: [0.955, 0.009, 275],
  mutedForeground: [0.49, 0.022, 275],
  accent: [0.945, 0.026, 275],
  accentForeground: [0.36, 0.12, 275],
  chart1: [0.535, 0.225, 275],
  border: [0.915, 0.01, 275],
  input: [0.89, 0.012, 275],
  ring: [0.535, 0.225, 275],
};

const status = (destructive: Oklch): StatusTokens => ({
  destructive,
  success: [0.5, 0.109, 162],
  successForeground: [0.985, 0, 0],
});

describe("contrastViolations", () => {
  it("flags the current light destructive on destructive/10 over background", () => {
    const v = contrastViolations(light, status([0.577, 0.215, 27]), "light");
    const hit = v.find((x) => x.pair === "S1:destructive/10@background");
    assert.ok(hit, "expected S1 violation");
    assert.equal(hit.min, 4.5);
    assert.ok(Math.abs(hit.ratio - 3.94) < 0.05, `got ${hit.ratio}`);
  });

  it("has no S1 violation with the corrected light destructive", () => {
    const v = contrastViolations(light, status([0.482, 0.196, 27]), "light");
    assert.deepEqual(
      v.filter((x) => x.pair.startsWith("S1:")),
      [],
    );
  });

  it("passes every pair for the corrected default light theme", () => {
    assert.deepEqual(
      contrastViolations(light, status([0.482, 0.196, 27]), "light"),
      [],
    );
  });

  it("uses /20 and /30 for S1 in dark mode", () => {
    const dark: ModeTokens = {
      ...light, // dark has no per-palette border/input; the extras are ignored
      background: [0.165, 0.014, 275],
      card: [0.205, 0.016, 275],
    };
    const v = contrastViolations(dark, status([0.2, 0.05, 27]), "dark");
    const names = v.map((x) => x.pair);
    assert.ok(names.includes("S1:destructive/30@card"));
    assert.ok(!names.includes("S1:destructive/10@card"));
  });
});
