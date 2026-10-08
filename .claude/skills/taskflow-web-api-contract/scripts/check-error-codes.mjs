#!/usr/bin/env node
/**
 * Compares the backend's error codes (CODE_TO_STATUS in
 * src/shared/filters/domain-exception.filter.ts) with the frontend's
 * `ErrorCode` union (src/types/common.ts). `ERROR_MESSAGES` in
 * src/lib/errors.ts is a Record<ErrorCode, string>, so tsc already forces a
 * message for every code in the union — the gap this catches is the union
 * itself falling behind the backend (the user then sees the raw API message).
 *
 * Run from the frontend root:
 *   node .claude/skills/taskflow-web-api-contract/scripts/check-error-codes.mjs [--backend <path>]
 * Default backend path: ../../Projects/TaskFlow-backend relative to the user
 * home layout (C:\Users\Pablo\Projects\TaskFlow-backend), or $TASKFLOW_BACKEND.
 * Exits 1 when the backend has codes the frontend doesn't know.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const argIdx = process.argv.indexOf("--backend");
const backendRoot =
  (argIdx > -1 && process.argv[argIdx + 1]) ||
  process.env.TASKFLOW_BACKEND ||
  path.join(os.homedir(), "Projects", "TaskFlow-backend");

const filterPath = path.join(backendRoot, "src/shared/filters/domain-exception.filter.ts");
const commonPath = path.join(process.cwd(), "src/types/common.ts");

if (!fs.existsSync(filterPath)) {
  console.error(`Backend filter not found at ${filterPath}. Pass --backend <path> or set TASKFLOW_BACKEND.`);
  process.exit(2);
}
if (!fs.existsSync(commonPath)) {
  console.error(`Not found: ${commonPath}. Run from the frontend root.`);
  process.exit(2);
}

const filterSrc = fs.readFileSync(filterPath, "utf-8");
const start = filterSrc.indexOf("{", filterSrc.indexOf("CODE_TO_STATUS"));
const body = filterSrc.slice(start, filterSrc.indexOf("@Catch("));
const backend = new Set([...body.matchAll(/^\s*([A-Z0-9_]+)\s*:/gm)].map((m) => m[1]));

const commonSrc = fs.readFileSync(commonPath, "utf-8");
const unionStart = commonSrc.indexOf("export type ErrorCode");
const union = commonSrc.slice(unionStart, commonSrc.indexOf(";", unionStart));
const frontend = new Set([...union.matchAll(/"([A-Z0-9_]+)"/g)].map((m) => m[1]));

const missing = [...backend].filter((c) => !frontend.has(c));
const onlyFront = [...frontend].filter((c) => !backend.has(c));

console.log(`backend: ${backend.size} codes | frontend ErrorCode: ${frontend.size} codes`);
if (onlyFront.length) {
  console.log(`\nOnly in the frontend (${onlyFront.length}) — fine if the API emits them outside the filter (timeouts, 500s); otherwise stale:`);
  for (const c of onlyFront) console.log(`  - ${c}`);
}
if (missing.length) {
  console.log(`\nMISSING in the frontend (${missing.length}) — add to ErrorCode (src/types/common.ts) and ERROR_MESSAGES (src/lib/errors.ts):`);
  for (const c of missing) console.log(`  - ${c}`);
  process.exit(1);
}
console.log("\nOK: every backend error code is known to the frontend.");
