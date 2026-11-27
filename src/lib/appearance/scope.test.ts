import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import type { EffectiveFolderAppearance } from "../../types/folder-appearance.ts";
import type { FolderAppearanceCatalog } from "./catalog.ts";
import { toScopeAttributes } from "./scope.ts";

const catalog = JSON.parse(
  readFileSync(new URL("./folder-appearance-catalog.json", import.meta.url), "utf8"),
) as FolderAppearanceCatalog;

const eff = (paletteKey: string, fontKey: string, weightKey: string): EffectiveFolderAppearance => ({
  paletteKey,
  fontKey,
  weightKey,
  source: { palette: "self", font: "self", weight: "self" },
  catalogVersion: catalog.catalogVersion,
});

const nonDefault = (list: { key: string }[]): string => {
  const k = list.find((x) => x.key !== "default");
  assert.ok(k);
  return k.key;
};

describe("toScopeAttributes", () => {
  it("omits default axes", () => {
    assert.deepEqual(toScopeAttributes(eff("default", "default", "default"), catalog), {});
    assert.deepEqual(toScopeAttributes(null, catalog), {});
    const palette = nonDefault(catalog.palettes);
    assert.deepEqual(toScopeAttributes(eff(palette, "default", "default"), catalog), {
      "data-folder-palette": palette,
    });
  });

  it("emits every non-default axis", () => {
    const palette = nonDefault(catalog.palettes);
    const font = nonDefault(catalog.fonts);
    const weight = nonDefault(catalog.weights);
    assert.deepEqual(toScopeAttributes(eff(palette, font, weight), catalog), {
      "data-folder-palette": palette,
      "data-folder-font": font,
      "data-folder-weight": weight,
    });
  });

  it("ignores unknown keys", () => {
    assert.deepEqual(toScopeAttributes(eff("zzz", "yyy", "xxx"), catalog), {});
  });
});
