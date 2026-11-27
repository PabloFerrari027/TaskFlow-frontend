import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import type { EffectiveFolderAppearance } from "../../types/folder-appearance.ts";
import type { FolderAppearanceCatalog } from "./catalog.ts";
import {
  nextActiveAppearance,
  readIgnoreFolderAppearance,
  toScopeAttributes,
  writeIgnoreFolderAppearance,
} from "./scope.ts";

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

describe("readIgnoreFolderAppearance", () => {
  it("readIgnoreFolderAppearance returns false on throw or junk", () => {
    const store = (v: string | null) => ({ getItem: () => v });
    assert.equal(readIgnoreFolderAppearance(store("1")), true);
    for (const junk of [null, "0", "true", "yes", " 1", ""]) {
      assert.equal(readIgnoreFolderAppearance(store(junk)), false);
    }
    assert.equal(readIgnoreFolderAppearance({ getItem: () => { throw new Error("blocked"); } }), false);
    assert.equal(readIgnoreFolderAppearance(null), false);
  });

  it("writeIgnoreFolderAppearance stores 1 or removes the key and swallows errors", () => {
    const data = new Map<string, string>();
    const store = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    writeIgnoreFolderAppearance(store, true);
    assert.equal(readIgnoreFolderAppearance(store), true);
    writeIgnoreFolderAppearance(store, false);
    assert.equal(readIgnoreFolderAppearance(store), false);
    const boom = () => { throw new Error("quota"); };
    assert.doesNotThrow(() => writeIgnoreFolderAppearance({ setItem: boom, removeItem: boom }, true));
    assert.doesNotThrow(() => writeIgnoreFolderAppearance(null, false));
  });
});

describe("nextActiveAppearance", () => {
  const a = { folderId: "A", workspaceId: "w", eff: eff("default", "default", "default") };
  const b = { folderId: "B", workspaceId: "w", eff: eff("default", "default", "default") };

  it("activate replaces", () => {
    assert.deepEqual(nextActiveAppearance(null, { type: "activate", ...a }), a);
    assert.deepEqual(nextActiveAppearance(a, { type: "activate", ...b }), b);
  });

  it("release of another folder keeps the active one", () => {
    assert.equal(nextActiveAppearance(b, { type: "release", folderId: "A" }), b);
    assert.equal(nextActiveAppearance(null, { type: "release", folderId: "A" }), null);
  });

  it("release of the active folder clears it", () => {
    assert.equal(nextActiveAppearance(a, { type: "release", folderId: "A" }), null);
  });

  it("pending of another folder keeps the current appearance until it activates", () => {
    let s = nextActiveAppearance(a, { type: "pending", folderId: "B" });
    assert.equal(s?.folderId, "A");
    assert.equal(s?.eff, a.eff);
    // The previous route's deferred release must not wipe it while B loads.
    s = nextActiveAppearance(s, { type: "release", folderId: "A" });
    assert.equal(s?.folderId, "A");
    assert.equal(s?.eff, a.eff);
    s = nextActiveAppearance(s, { type: "activate", ...b });
    assert.deepEqual(s, b);
    // Pending with nothing active stays empty; pending of the active folder is a no-op.
    assert.equal(nextActiveAppearance(null, { type: "pending", folderId: "B" }), null);
    assert.equal(nextActiveAppearance(a, { type: "pending", folderId: "A" }), a);
  });

  it("leaving folders after pending clears", () => {
    let s = nextActiveAppearance(a, { type: "pending", folderId: "B" });
    s = nextActiveAppearance(s, { type: "release", folderId: "A" });
    // B unmounts before loading (went home): nothing is left to theme.
    assert.equal(nextActiveAppearance(s, { type: "release", folderId: "B" }), null);
    // Same when B's release lands before A's.
    const t = nextActiveAppearance(a, { type: "pending", folderId: "B" });
    assert.equal(nextActiveAppearance(t, { type: "release", folderId: "B" }), null);
  });
});
