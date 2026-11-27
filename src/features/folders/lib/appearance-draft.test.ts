import assert from "node:assert/strict";
import { test } from "node:test";
import { diffAppearanceDraft, previewEffectiveAfterMove } from "./appearance-draft.ts";

const keys = (paletteKey: string | null, fontKey: string | null, weightKey: string | null) => ({
  paletteKey,
  fontKey,
  weightKey,
});

test("diffAppearanceDraft sends only changed axes", () => {
  const saved = keys("ocean", null, "default");
  assert.deepEqual(diffAppearanceDraft(saved, saved), {});
  assert.deepEqual(diffAppearanceDraft(saved, keys("ocean", "inter", "default")), {
    fontKey: "inter",
  });
  // Resetting to inherit sends an explicit null.
  assert.deepEqual(diffAppearanceDraft(saved, keys(null, null, "default")), { paletteKey: null });
});

test("diffAppearanceDraft treats null (inherit) as different from 'default' (cut inheritance)", () => {
  assert.deepEqual(diffAppearanceDraft(keys(null, null, null), keys("default", null, null)), {
    paletteKey: "default",
  });
  assert.deepEqual(diffAppearanceDraft(keys("default", null, null), keys(null, null, null)), {
    paletteKey: null,
  });
});

test("previewEffectiveAfterMove inherits only null axes", () => {
  const dest = {
    paletteKey: "ocean",
    fontKey: "inter",
    weightKey: "bold",
    source: { palette: "self", font: "self", weight: "self" },
    catalogVersion: 1,
  } as const;
  assert.deepEqual(previewEffectiveAfterMove(keys(null, "nunito", "default"), dest), {
    paletteKey: "ocean",
    fontKey: "nunito",
    weightKey: "default",
  });
  assert.deepEqual(previewEffectiveAfterMove(keys(null, null, null), null), {
    paletteKey: "default",
    fontKey: "default",
    weightKey: "default",
  });
});
