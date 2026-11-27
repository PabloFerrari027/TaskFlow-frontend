import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { FolderAppearanceCatalog } from "@/lib/appearance/catalog";
import type { EffectiveFolderAppearance, FolderAppearanceSource } from "@/types/folder-appearance";
import {
  inheritedAppearance,
  moveAppearanceNotice,
  previewResetStyle,
  resolveDraft,
  sourceLabel,
  type AppearanceFolderLike,
} from "./appearance-options.ts";

const catalog = JSON.parse(
  readFileSync(new URL("../../../lib/appearance/folder-appearance-catalog.json", import.meta.url), "utf8"),
) as FolderAppearanceCatalog;

type Src = FolderAppearanceSource;

function eff(
  keys: [string, string, string],
  source: [Src, Src, Src] = ["default", "default", "default"],
  ids?: [string | null, string | null, string | null],
): EffectiveFolderAppearance {
  return {
    paletteKey: keys[0],
    fontKey: keys[1],
    weightKey: keys[2],
    source: { palette: source[0], font: source[1], weight: source[2] },
    ...(ids ? { sourceFolderId: { palette: ids[0], font: ids[1], weight: ids[2] } } : {}),
    catalogVersion: 1,
  };
}

function folder(
  id: string,
  parentId: string | null,
  own: [string | null, string | null, string | null],
  effective: EffectiveFolderAppearance,
): AppearanceFolderLike {
  return {
    id,
    parentId,
    appearance: { paletteKey: own[0], fontKey: own[1], weightKey: own[2] },
    effectiveAppearance: effective,
  };
}

const names: Record<string, string> = { clientes: "Clientes", pai: "Pai" };
const nameOf = (id: string) => names[id];

test("root folder inherits the TaskFlow default", () => {
  const root = folder("r", null, ["azul", null, null], eff(["azul", "default", "default"], ["self", "default", "default"]));
  const inh = inheritedAppearance(root, undefined, nameOf);
  assert.deepEqual(inh.palette, { value: "default", label: "Padrão do TaskFlow" });
  assert.deepEqual(inh.font, { value: "default", label: "Padrão do TaskFlow" });
});

test("inheriting axis uses the folder's own effective value and source name", () => {
  const f = folder(
    "f",
    "pai",
    [null, null, "leve"],
    eff(["verde", "default", "leve"], ["ancestor", "default", "self"], ["clientes", null, "f"]),
  );
  const parent = folder("pai", "clientes", [null, null, null], eff(["verde", "default", "marcante"], ["ancestor", "default", "self"], ["clientes", null, "pai"]));
  const inh = inheritedAppearance(f, parent, nameOf);
  assert.deepEqual(inh.palette, { value: "verde", label: "Igual à pasta acima (Clientes)" });
  // Default source has no folder: no name.
  assert.deepEqual(inh.font, { value: "default", label: "Igual à pasta acima" });
  // Own axis: what the parent would give.
  assert.deepEqual(inh.weight, { value: "marcante", label: "Igual à pasta acima (Pai)" });
});

test("without sourceFolderId or a known name the label has no name", () => {
  const f = folder("f", "pai", [null, "inter", null], eff(["azul", "inter", "default"], ["ancestor", "self", "default"]));
  const inh = inheritedAppearance(f, undefined, nameOf);
  assert.equal(inh.palette.label, "Igual à pasta acima");
  assert.equal(inh.palette.value, "azul");
  // Parent not loaded: falls back to the default value.
  assert.deepEqual(inh.font, { value: "default", label: "Igual à pasta acima" });

  const g = folder("g", "pai", [null, null, null], eff(["azul", "default", "default"], ["ancestor", "default", "default"], ["desconhecida", null, null]));
  assert.equal(inheritedAppearance(g, undefined, nameOf).palette.label, "Igual à pasta acima");
});

test("resolveDraft keeps own axes and fills null ones with the inherited value", () => {
  const inherited = {
    palette: { value: "verde", label: "" },
    font: { value: "default", label: "" },
    weight: { value: "leve", label: "" },
  };
  assert.deepEqual(resolveDraft({ paletteKey: null, fontKey: "inter", weightKey: "default" }, inherited), {
    paletteKey: "verde",
    fontKey: "inter",
    weightKey: "default",
  });
});

test("sourceLabel describes where each axis comes from", () => {
  const e = eff(["azul", "inter", "default"], ["ancestor", "self", "default"], ["clientes", "f", null]);
  assert.equal(sourceLabel(e, "palette", nameOf), "Igual à pasta Clientes");
  assert.equal(sourceLabel(e, "font", nameOf), "Definida nesta pasta");
  assert.equal(sourceLabel(e, "weight", nameOf), "Padrão do TaskFlow");
  const noIds = eff(["azul", "default", "default"], ["ancestor", "default", "default"]);
  assert.equal(sourceLabel(noIds, "palette", nameOf), "Igual à pasta acima");
});

test("moveAppearanceNotice only warns when the effective appearance changes", () => {
  const moving = folder("m", "a", [null, "inter", null], eff(["azul", "inter", "default"], ["ancestor", "self", "default"]));
  const sameDest = eff(["azul", "nunito", "default"]);
  assert.equal(moveAppearanceNotice(moving, sameDest, "Destino"), null);
  const otherDest = eff(["verde", "default", "default"]);
  assert.equal(
    moveAppearanceNotice(moving, otherDest, "Destino"),
    "A aparência desta pasta vai seguir a de “Destino”.",
  );
  // Root destination: inherited axes go back to the default.
  assert.equal(
    moveAppearanceNotice(moving, null, null),
    "A aparência desta pasta vai voltar ao padrão do TaskFlow.",
  );
  const own = folder("o", "a", ["rosa", "inter", "leve"], eff(["rosa", "inter", "leve"], ["self", "self", "self"]));
  assert.equal(moveAppearanceNotice(own, otherDest, "Destino"), null);
});

test("previewResetStyle restores default axes inside a themed area", () => {
  const style = previewResetStyle(
    { paletteKey: "default", fontKey: "default", weightKey: "default" },
    catalog,
    "light",
    "Jakarta",
  );
  const def = catalog.palettes.find((p) => p.key === "default")!;
  const p = def.light.primary;
  assert.equal(style["--primary"], `oklch(${p[0]} ${p[1]} ${p[2]})`);
  assert.ok(style["--chart-1"]);
  assert.ok(style["--border"]);
  assert.ok(style["--shadow-card"]);
  assert.equal(style["--font-sans"], "Jakarta");
  assert.equal(style.fontFamily, "var(--font-sans)");
  assert.equal(style["--font-weight-semibold"], "600");

  const dark = previewResetStyle(
    { paletteKey: "default", fontKey: "inter", weightKey: "leve" },
    catalog,
    "dark",
    "",
  );
  // Dark keeps border/input/shadows from <html>, like the generated CSS.
  assert.equal(dark["--border"], undefined);
  assert.ok(dark["--primary"]);
  assert.equal(dark["--font-sans"], undefined);
  assert.equal(dark["--font-weight-semibold"], undefined);

  assert.deepEqual(
    previewResetStyle({ paletteKey: "azul", fontKey: "inter", weightKey: "leve" }, catalog, "light", "J"),
    {},
  );
});
