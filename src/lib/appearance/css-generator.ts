import type { FolderAppearanceCatalog } from "./catalog.ts";

const kebab = (name: string): string =>
  name.replace(/([a-z])(\d)/g, "$1-$2").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const oklch = (v: readonly number[]): string => `oklch(${v[0]} ${v[1]} ${v[2]})`;

function declarations(tokens: object): string {
  return Object.entries(tokens as Record<string, number[]>)
    .map(([name, value]) => `  --${kebab(name)}: ${oklch(value)};`)
    .join("\n");
}

// Same shape as the shadows in globals.css, only the hue changes.
function shadows(hue: number): string {
  return [
    `  --shadow-card: 0 1px 2px oklch(0.25 0.03 ${hue} / 0.04), 0 2px 10px -3px oklch(0.25 0.03 ${hue} / 0.07);`,
    `  --shadow-card-hover: 0 2px 4px oklch(0.25 0.03 ${hue} / 0.05), 0 10px 24px -8px oklch(0.25 0.03 ${hue} / 0.16);`,
  ].join("\n");
}

/** Static CSS for every non-default palette, font and weight of the catalog. */
export function generateFolderAppearanceCss(catalog: FolderAppearanceCatalog): string {
  const out: string[] = [
    `/* Gerado por npm run gen:appearance a partir do catálogo v${catalog.catalogVersion}. Não editar. */`,
  ];

  for (const p of catalog.palettes) {
    if (p.key === "default") continue;
    out.push(
      `[data-folder-palette="${p.key}"] {\n${declarations(p.light)}\n${shadows(p.hue)}\n}`,
      `.dark [data-folder-palette="${p.key}"] {\n${declarations(p.dark)}\n}`,
    );
  }

  out.push(
    "[data-folder-palette]:not([data-folder-portal-host]) {\n  background-color: var(--background);\n  color: var(--foreground);\n}",
  );

  for (const f of catalog.fonts) {
    if (f.key === "default") continue;
    out.push(
      `[data-folder-font="${f.key}"] {\n  --font-sans: var(--font-folder-${f.key});\n  font-family: var(--font-sans);\n}`,
    );
  }

  for (const w of catalog.weights) {
    if (w.key === "default") continue;
    out.push(
      `[data-folder-weight="${w.key}"] {\n  --font-weight-medium: ${w.medium};\n  --font-weight-semibold: ${w.semibold};\n  --font-weight-bold: ${w.bold};\n}`,
    );
  }

  return out.join("\n\n") + "\n";
}
