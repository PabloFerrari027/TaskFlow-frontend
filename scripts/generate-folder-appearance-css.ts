import { readFileSync, writeFileSync } from "node:fs";
import { generateFolderAppearanceCss } from "../src/lib/appearance/css-generator.ts";
import type { FolderAppearanceCatalog } from "../src/lib/appearance/catalog.ts";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(
  readFileSync(new URL("src/lib/appearance/folder-appearance-catalog.json", root), "utf8"),
) as FolderAppearanceCatalog;

writeFileSync(
  new URL("src/app/folder-appearance.css", root),
  generateFolderAppearanceCss(catalog),
);
