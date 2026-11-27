import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateFolderAppearanceCss } from "./css-generator.ts";
import type { FolderAppearanceCatalog } from "./catalog.ts";

const catalog = JSON.parse(
  readFileSync(new URL("./folder-appearance-catalog.json", import.meta.url), "utf8"),
) as FolderAppearanceCatalog;

test("committed css matches the generator", () => {
  const committed = readFileSync(
    new URL("../../app/folder-appearance.css", import.meta.url),
    "utf8",
  );
  assert.equal(committed, generateFolderAppearanceCss(catalog), "rode npm run gen:appearance");
});

test("default emits no palette rule", () => {
  const css = generateFolderAppearanceCss(catalog);
  assert.ok(!css.includes('[data-folder-palette="default"]'));
  assert.ok(!css.includes('[data-folder-font="default"]'));
  assert.ok(css.includes('[data-folder-palette="azul"]'));
  assert.ok(css.startsWith(`/* Gerado por npm run gen:appearance a partir do catálogo v${catalog.catalogVersion}. Não editar. */`));
});

test("dark rule carries card and popover", () => {
  const css = generateFolderAppearanceCss(catalog);
  const m = /\.dark \[data-folder-palette="azul"\] \{([^}]*)\}/.exec(css);
  assert.ok(m, "dark azul rule missing");
  assert.match(m[1], /--card: oklch\(/);
  assert.match(m[1], /--popover: oklch\(/);
  assert.match(m[1], /--primary-hover: oklch\(/);
  assert.match(m[1], /--chart-1: oklch\(/);
  const light = /\n\[data-folder-palette="azul"\] \{([^}]*)\}/.exec(css);
  assert.ok(light && /--shadow-card-hover:/.test(light[1]) && /--border:/.test(light[1]));
});

test("emits font and weight rules", () => {
  const css = generateFolderAppearanceCss(catalog);
  assert.match(css, /\[data-folder-font="inter"\] \{\n  --font-sans: var\(--font-folder-inter\);\n  font-family: var\(--font-sans\);\n\}/);
  assert.match(css, /\[data-folder-weight="marcante"\] \{[^}]*--font-weight-bold: 800;/);
  assert.match(css, /\[data-folder-palette\]:not\(\[data-folder-portal-host\]\) \{/);
});

test("dark rule covers every variable the light rule declares", () => {
  const css = generateFolderAppearanceCss(catalog);
  const names = (body: string): Set<string> =>
    new Set([...body.matchAll(/^\s*(--[\w-]+):/gm)].map((x) => x[1]));
  for (const p of catalog.palettes.filter((x) => x.key !== "default")) {
    const light = new RegExp(`\\n\\[data-folder-palette="${p.key}"\\] \\{([^}]*)\\}`).exec(css);
    const dark = new RegExp(`\\.dark \\[data-folder-palette="${p.key}"\\] \\{([^}]*)\\}`).exec(css);
    assert.ok(light && dark, p.key);
    const darkNames = names(dark[1]);
    for (const n of names(light[1])) assert.ok(darkNames.has(n), `${p.key}: dark missing ${n}`);
  }
});
