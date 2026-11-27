import assert from "node:assert/strict";
import { test } from "node:test";
import { isAppearanceApplied, isPreviewTakenOver, shouldPreloadFont } from "./appearance-gate.ts";

test("aparência só é aplicada com a flag ligada e sem opt-out", () => {
  assert.equal(isAppearanceApplied(true, false), true);
  assert.equal(isAppearanceApplied(true, true), false);
  assert.equal(isAppearanceApplied(false, false), false);
  assert.equal(isAppearanceApplied(undefined, false), false);
});

test("pré-carga da fonte só quando aplicada e com fonte não padrão", () => {
  assert.equal(shouldPreloadFont(true, "nunito"), true);
  assert.equal(shouldPreloadFont(false, "nunito"), false);
  assert.equal(shouldPreloadFont(true, "default"), false);
  assert.equal(shouldPreloadFont(true, undefined), false);
});

test("prévia perde o controle quando o tema muda para outro que não o dela", () => {
  assert.equal(isPreviewTakenOver("dark", "dark"), false);
  assert.equal(isPreviewTakenOver("light", "dark"), true);
  assert.equal(isPreviewTakenOver("system", "dark"), true);
  assert.equal(isPreviewTakenOver("light", null), false);
});
