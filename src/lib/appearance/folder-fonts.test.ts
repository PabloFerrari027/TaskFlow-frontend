import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { FOLDER_FONT_KEYS } from "../../types/folder-appearance.ts";

test("FOLDER_FONT_KEYS matches the catalog JSON fonts", () => {
  const json = JSON.parse(fs.readFileSync("src/lib/appearance/folder-appearance-catalog.json", "utf8"));
  const keys = (json.fonts as Array<{ key: string }>).map((f) => f.key);
  assert.deepEqual([...FOLDER_FONT_KEYS], keys);
});
