import assert from "node:assert/strict";
import { test } from "node:test";
import { isWorkspaceFolderDetail, mergeFolderDetail } from "./folder-cache.ts";
import { readIgnoreFolderAppearance } from "./folder-appearance-pref.ts";
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

const q = (queryKey: readonly unknown[], data?: unknown) => ({ queryKey, state: { data } });

test("matches only folder detail keys of the workspace", () => {
  assert.equal(isWorkspaceFolderDetail(q(["folders", "f1"], { workspaceId: "w1" }), "w1"), true);
  assert.equal(isWorkspaceFolderDetail(q(["folders", "f1", "members"], { workspaceId: "w1" }), "w1"), false);
  assert.equal(isWorkspaceFolderDetail(q(["folders", "workspace", "w1"], { workspaceId: "w1" }), "w1"), false);
  assert.equal(isWorkspaceFolderDetail(q(["folders", "f1"], { workspaceId: "w2" }), "w1"), false);
  assert.equal(isWorkspaceFolderDetail(q(["folders", "f1"]), "w1"), false);
  assert.equal(isWorkspaceFolderDetail(q(["folders", "f1"], null), "w1"), false);
});

test("ignore preference is on only when the key is exactly 1; absent or throwing storage is off", () => {
  const store = (v: string | null) => ({ getItem: () => v });
  assert.equal(readIgnoreFolderAppearance(store("1")), true);
  assert.equal(readIgnoreFolderAppearance(store(null)), false);
  assert.equal(readIgnoreFolderAppearance(store("0")), false);
  assert.equal(readIgnoreFolderAppearance({ getItem: () => { throw new Error("blocked"); } }), false);
  assert.equal(readIgnoreFolderAppearance(undefined), false);
});
