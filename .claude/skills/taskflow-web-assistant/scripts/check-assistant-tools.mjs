#!/usr/bin/env node
/**
 * Compares the assistant tools registered in the backend
 * (src/modules/actions/application/catalogs/*-actions.ts, `name: '...'`) with
 * what the frontend knows about them:
 *   - TOOL_PAST_LABEL in src/features/assistant/lib/tool-labels.ts
 *     (missing -> the summary shows the raw tool name to a lay user);
 *   - `case "<tool>"` in applyConfirmedActionEffects
 *     (src/features/assistant/hooks/use-assistant.ts) for write tools
 *     (missing -> the screen keeps stale data after the action runs).
 * Read tools (kind: 'read') need neither.
 *
 * Run from the frontend root:
 *   node .claude/skills/taskflow-web-assistant/scripts/check-assistant-tools.mjs [--backend <path>]
 * Exits 1 when a backend write tool is missing on either side.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const argIdx = process.argv.indexOf("--backend");
const backendRoot =
  (argIdx > -1 && process.argv[argIdx + 1]) ||
  process.env.TASKFLOW_BACKEND ||
  path.join(os.homedir(), "Projects", "TaskFlow-backend");
const catalogsDir = path.join(backendRoot, "src/modules/actions/application/catalogs");

if (!fs.existsSync(catalogsDir)) {
  console.error(`Backend catalogs not found at ${catalogsDir}. Pass --backend <path> or set TASKFLOW_BACKEND.`);
  process.exit(2);
}

// Each definition is an object literal with `name: '...'` followed (before the next name) by `kind: '...'`.
const tools = [];
for (const file of fs.readdirSync(catalogsDir).filter((f) => f.endsWith("-actions.ts"))) {
  const src = fs.readFileSync(path.join(catalogsDir, file), "utf-8");
  const names = [...src.matchAll(/^\s*name:\s*'([a-z_]+)'/gm)];
  names.forEach((m, i) => {
    const end = i + 1 < names.length ? names[i + 1].index : src.length;
    const kind = src.slice(m.index, end).match(/kind:\s*'(read|standard|critical)'/)?.[1] ?? "?";
    tools.push({ name: m[1], kind, catalog: file });
  });
}

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf-8");
const summarySrc = read("src/features/assistant/lib/tool-labels.ts");
const labelBlock = summarySrc.slice(summarySrc.indexOf("TOOL_PAST_LABEL"), summarySrc.indexOf("};", summarySrc.indexOf("TOOL_PAST_LABEL")));
const labels = new Set([...labelBlock.matchAll(/^\s*([a-z_]+):/gm)].map((m) => m[1]));

const hooksSrc = read("src/features/assistant/hooks/use-assistant.ts");
const fnStart = hooksSrc.indexOf("function applyConfirmedActionEffects");
const fnBody = hooksSrc.slice(fnStart, hooksSrc.indexOf("\n}\n", fnStart));
const cases = new Set([...fnBody.matchAll(/case "([a-z_]+)"/g)].map((m) => m[1]));

const writes = tools.filter((t) => t.kind !== "read");
const noLabel = writes.filter((t) => !labels.has(t.name));
const noCase = writes.filter((t) => !cases.has(t.name));
const unknown = [...new Set([...labels, ...cases])].filter((n) => !tools.some((t) => t.name === n));

console.log(`backend tools: ${tools.length} (${writes.length} write, ${tools.length - writes.length} read)`);
const report = (title, list) => {
  if (!list.length) return;
  console.log(`\n${title} (${list.length}):`);
  for (const t of list) console.log(`  - ${t.name ?? t}${t.kind ? ` [${t.kind}, ${t.catalog}]` : ""}`);
};
report("Write tools WITHOUT a TOOL_PAST_LABEL entry", noLabel);
report("Write tools WITHOUT a case in applyConfirmedActionEffects", noCase);
report("Frontend mentions tools the backend no longer has", unknown);

if (noLabel.length || noCase.length) process.exit(1);
console.log("\nOK: every backend write tool has a label and a cache case in the frontend.");
