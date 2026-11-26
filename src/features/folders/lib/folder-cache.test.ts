import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeFolderDetail } from "./folder-cache.ts";
import type { Folder } from "@/types/folder";

const effective = (paletteKey: string) => ({
  paletteKey,
  fontKey: "default",
  weightKey: "default",
  source: { palette: "self", font: "default", weight: "default" },
  catalogVersion: 1,
});

function folder(name: string, paletteKey?: string): Folder {
  return {
    id: "f1",
    name,
    appearance: { paletteKey: paletteKey ?? null, fontKey: null, weightKey: null },
    ...(paletteKey ? { effectiveAppearance: effective(paletteKey) } : {}),
  } as unknown as Folder;
}

test("mergeFolderDetail keeps previous effectiveAppearance", () => {
  const merged = mergeFolderDetail(folder("A", "ocean"), folder("B"));
  assert.equal(merged.name, "B");
  assert.equal(merged.effectiveAppearance.paletteKey, "ocean");
});

test("mergeFolderDetail prefers the incoming one when present", () => {
  const merged = mergeFolderDetail(folder("A", "ocean"), folder("A", "forest"));
  assert.equal(merged.effectiveAppearance.paletteKey, "forest");
});

test("mergeFolderDetail works without prev", () => {
  const next = folder("A");
  assert.equal(mergeFolderDetail(undefined, next), next);
  assert.equal(mergeFolderDetail(undefined, folder("A", "ocean")).effectiveAppearance.paletteKey, "ocean");
});
