import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  composite,
  contrastRatio,
  isInGamut,
  toHex,
  toSrgbGamma,
} from "./color-math.ts";

describe("color-math", () => {
  it("matches the known contrast of the current default button", () => {
    const ratio = contrastRatio(
      toSrgbGamma([0.985, 0, 0]),
      toSrgbGamma([0.535, 0.225, 275]),
    );
    assert.ok(Math.abs(ratio - 5.36) < 0.005, `got ${ratio}`);
  });

  it("flags the current dark primary as out of gamut and the corrected one as inside", () => {
    assert.equal(isInGamut([0.68, 0.18, 275]), false);
    assert.equal(isInGamut([0.68, 0.169, 275]), true);
  });

  it("composites primary/10 over white like the browser", () => {
    const p = toSrgbGamma([0.535, 0.225, 275]);
    const ratio = contrastRatio(p, composite(p, 0.1, [1, 1, 1]));
    assert.ok(Math.abs(ratio - 4.86) < 0.05, `got ${ratio}`);
  });

  it("formats lowercase hex", () => {
    assert.equal(toHex(toSrgbGamma([0.5, 0.164, 255])), "#0161bd");
  });
});
