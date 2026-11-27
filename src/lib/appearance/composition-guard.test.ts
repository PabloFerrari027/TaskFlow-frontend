import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";

// Guard against color compositions (alpha over a token) that can fall below
// the AA contrast ratio. Folder palettes recolor the tokens, so only opaque
// tokens carry a contrast guarantee (spec 4.3).

const SRC_ROOT = join(import.meta.dirname, "..", "..");
const PROJECT_ROOT = join(SRC_ROOT, "..");

const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  { name: "hover:bg-primary/80", pattern: /(^|:)hover:bg-primary\/80$/ },
  { name: "ring-ring/50", pattern: /(^|:)ring-ring\/50$/ },
  {
    name: "focus ring-destructive/20|40",
    pattern: /(^|:)(focus|focus-visible|focus-within):(\S*:)?ring-destructive\/(20|40)$/,
  },
  { name: "text-primary-foreground/NN", pattern: /(^|:)text-primary-foreground\/\d+$/ },
  { name: "text-destructive/NN", pattern: /(^|:)text-destructive\/\d+$/ },
  { name: "bg-destructive/70|80", pattern: /(^|:)bg-destructive\/(70|80)$/ },
];

// Legitimate exceptions: "<relative file>::<token>" -> reason. Keep each commented.
// Allowed by spec and therefore not listed: bg-primary/10, bg-destructive/10|20|30,
// bg-success/5|10|15, and dark:/aria-invalid: error rings that are not focus or text.
const ALLOWLIST: Record<string, string> = {};

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "graphify-out" || entry.name === "node_modules") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsx(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("composition guard", () => {
  it("has no forbidden color composition outside the allowlist", () => {
    const violations: string[] = [];
    for (const file of listTsx(SRC_ROOT)) {
      const rel = relative(PROJECT_ROOT, file);
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          for (const token of line.split(/[\s"'`]+/)) {
            for (const rule of FORBIDDEN) {
              if (!rule.pattern.test(token)) continue;
              if (ALLOWLIST[`${rel}::${token}`]) continue;
              violations.push(`${rel}:${index + 1} [${rule.name}] ${token}`);
            }
          }
        });
    }
    assert.deepEqual(violations, [], `Forbidden compositions:\n${violations.join("\n")}`);
  });
});
