import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { isInGamut } from "./color-math.ts";
import { computeContentHash, swatchFor, type FolderAppearanceCatalog } from "./catalog.ts";
import { contrastViolations } from "./contrast-pairs.ts";
import { parseThemeBlocks, toModeTokens } from "./globals-tokens.ts";

const catalog = JSON.parse(
  readFileSync(new URL("./folder-appearance-catalog.json", import.meta.url), "utf8"),
) as FolderAppearanceCatalog;
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

describe("folder appearance catalog", () => {
  it("catalog hash matches contentHash", async () => {
    const { contentHash, ...rest } = catalog;
    assert.equal(await computeContentHash(rest), contentHash);
  });

  it("catalog palettes pass contrast and gamut", () => {
    for (const p of catalog.palettes) {
      for (const mode of ["light", "dark"] as const) {
        assert.deepEqual(contrastViolations(p[mode], catalog.status[mode], mode), [], `${p.key} ${mode}`);
        for (const [name, c] of Object.entries(p[mode])) {
          assert.equal(isInGamut(c), true, `${p.key} ${mode} ${name}`);
        }
      }
    }
    for (const mode of ["light", "dark"] as const) {
      for (const [name, c] of Object.entries(catalog.status[mode])) {
        assert.equal(isInGamut(c), true, `status ${mode} ${name}`);
      }
    }
  });

  it("default palette equals globals.css", () => {
    const blocks = parseThemeBlocks(css);
    const def = catalog.palettes.find((p) => p.key === "default");
    assert.ok(def);
    for (const mode of ["light", "dark"] as const) {
      const { tokens, status } = toModeTokens(blocks[mode], mode);
      for (const [name, value] of Object.entries(tokens)) {
        assert.deepEqual(value, (def[mode] as Record<string, unknown>)[name], `${mode} ${name}`);
      }
      assert.deepEqual(status, catalog.status[mode], `${mode} status`);
    }
  });

  it("swatchFor returns the palette swatch or null", () => {
    const def = catalog.palettes[0];
    assert.equal(swatchFor(def.key, "light", catalog), def.swatch.light);
    assert.equal(swatchFor(def.key, "dark", catalog), def.swatch.dark);
    assert.equal(swatchFor("nope", "light", catalog), null);
  });
});
