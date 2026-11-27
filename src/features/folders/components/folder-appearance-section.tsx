"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { FolderAppearanceCatalog } from "@/lib/appearance/catalog";
import { swatchFor } from "@/lib/appearance/catalog";
import catalogJson from "@/lib/appearance/folder-appearance-catalog.json";
import { FOLDER_FONTS } from "@/lib/appearance/folder-fonts";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { useMyFeaturesQuery } from "@/features/feature-flags/hooks/use-my-features";
import { useFoldersQuery } from "@/features/folders/hooks/use-folders";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";
import { useUpdateFolderAppearanceMutation } from "@/features/folders/hooks/use-folder-appearance";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { diffAppearanceDraft } from "@/features/folders/lib/appearance-draft";
import {
  AXIS_KEY,
  inheritedAppearance,
  resolveDraft,
  sourceLabel,
  type AppearanceAxis,
  type InheritedAppearance,
} from "@/features/folders/lib/appearance-options";
import { FolderAppearancePreview, useRootFontSans } from "@/features/folders/components/folder-appearance-preview";
import type { Folder } from "@/types/folder";
import type { FolderAppearanceKeys, FolderFontKey } from "@/types/folder-appearance";

// JSON imports widen tuples (Oklch) to number[]; the shape is checked by catalog.test.ts.
const catalog = catalogJson as unknown as FolderAppearanceCatalog;

// Radix radio values are strings; this one stands for null (inherit).
const INHERIT = "__inherit";
const SECTION_ID = "aparencia";
const WEIGHT_SAMPLE = "Revisar a arte da campanha";

const AXIS_TITLE: Record<AppearanceAxis, string> = { palette: "Cores", font: "Fonte", weight: "Peso" };

// The default font comes from <html>: the themed <main> may override --font-sans.
function fontFamilyOf(key: string, rootFontSans: string): string | undefined {
  if (key === "default") return rootFontSans || undefined;
  return FOLDER_FONTS[key as Exclude<FolderFontKey, "default">]?.style.fontFamily;
}

function optionsOf(axis: AppearanceAxis): { key: string; name: string }[] {
  if (axis === "palette") return catalog.palettes;
  if (axis === "font") return catalog.fonts;
  return catalog.weights;
}

function nameOfOption(axis: AppearanceAxis, key: string): string {
  return optionsOf(axis).find((o) => o.key === key)?.name ?? key;
}

/** "Aparência da pasta": editable for workspace OWNER/ADMIN, read-only for MEMBER, hidden for others. */
export function FolderAppearanceSection({ folderId }: { folderId: string }) {
  const { userId } = useAuth();
  const { folder, canManage } = useFolderPermission(folderId);
  const workspaceId = folder?.workspaceId ?? null;
  const { data: features } = useMyFeaturesQuery(workspaceId, { enabled: Boolean(workspaceId) });
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const foldersQuery = useFoldersQuery(workspaceId);

  const role = workspaceQuery.data?.members.find((m) => m.userId === userId)?.role;
  const folders = foldersQuery.data?.data;
  const nameOf = React.useCallback(
    (id: string) => folders?.find((f) => f.id === id)?.name,
    [folders],
  );

  if (!folder || features?.["folders.appearance"] !== true) return null;
  if (!canManage && role !== "MEMBER") return null;

  const parent = folder.parentId ? folders?.find((f) => f.id === folder.parentId) : undefined;

  return (
    <Card id={SECTION_ID} className="scroll-mt-20">
      <ScrollToHash />
      <CardHeader>
        <CardTitle>Aparência da pasta</CardTitle>
        <CardDescription>
          {canManage
            ? "Escolha as cores, a fonte e o peso das letras desta pasta. As subpastas seguem o que você escolher, a menos que tenham a própria aparência."
            : "Aparência definida por quem administra o espaço"}
        </CardDescription>
      </CardHeader>
      {canManage ? (
        <AppearanceEditor key={folder.id} folder={folder} inherited={inheritedAppearance(folder, parent, nameOf)} />
      ) : (
        <AppearanceReadOnly folder={folder} nameOf={nameOf} />
      )}
    </Card>
  );
}

/** Opening "settings#aparencia" from the folder menu: the card only exists after the data loads. */
function ScrollToHash() {
  React.useEffect(() => {
    if (window.location.hash === `#${SECTION_ID}`) {
      document.getElementById(SECTION_ID)?.scrollIntoView({ block: "start" });
    }
  }, []);
  return null;
}

function AppearanceEditor({ folder, inherited }: { folder: Folder; inherited: InheritedAppearance }) {
  const mutation = useUpdateFolderAppearanceMutation(folder.id);
  // Only the axes the user touched; the rest follows the saved state, so a
  // save by someone else on another axis is never overwritten.
  const [touched, setTouched] = React.useState<Partial<FolderAppearanceKeys>>({});
  const saved = folder.appearance;
  const draft: FolderAppearanceKeys = { ...saved, ...touched };
  const patch = diffAppearanceDraft(saved, draft);
  const dirty = Object.keys(patch).length > 0;
  const resolved = resolveDraft(draft, inherited);

  const setAxis = (axis: AppearanceAxis, value: string) =>
    setTouched((t) => ({ ...t, [AXIS_KEY[axis]]: value === INHERIT ? null : value }));

  return (
    <>
      <CardContent className="space-y-6">
        <AxisGroup axis="palette" value={draft.paletteKey} inherited={inherited.palette} onChange={setAxis} disabled={mutation.isPending} />
        <AxisGroup axis="font" value={draft.fontKey} inherited={inherited.font} onChange={setAxis} disabled={mutation.isPending} />
        <AxisGroup axis="weight" value={draft.weightKey} inherited={inherited.weight} onChange={setAxis} disabled={mutation.isPending} />
        <FolderAppearancePreview resolved={resolved} base={folder.effectiveAppearance} />
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" disabled={!dirty || mutation.isPending} onClick={() => setTouched({})}>
          Descartar
        </Button>
        <Button
          type="button"
          disabled={!dirty || mutation.isPending}
          loading={mutation.isPending}
          onClick={() => mutation.mutate(patch, { onSuccess: () => setTouched({}) })}
        >
          Salvar aparência
        </Button>
      </CardFooter>
    </>
  );
}

interface AxisGroupProps {
  axis: AppearanceAxis;
  value: string | null;
  inherited: { value: string; label: string };
  disabled: boolean;
  onChange: (axis: AppearanceAxis, value: string) => void;
}

function AxisGroup({ axis, value, inherited, disabled, onChange }: AxisGroupProps) {
  const idPrefix = React.useId();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const rootFontSans = useRootFontSans();
  const title = AXIS_TITLE[axis];
  const options = [{ key: INHERIT, name: inherited.label }, ...optionsOf(axis)];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <RadioGroup
        aria-label={title}
        value={value ?? INHERIT}
        onValueChange={(v) => onChange(axis, v)}
        disabled={disabled}
        className={cn(
          "grid gap-2",
          axis === "weight" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        )}
      >
        {options.map((option) => {
          const id = `${idPrefix}-${option.key}`;
          // The inherit option previews the value it would bring.
          const shown = option.key === INHERIT ? inherited.value : option.key;
          const swatch = axis === "palette" ? swatchFor(shown, mode, catalog) : null;
          const weight = axis === "weight" ? catalog.weights.find((w) => w.key === shown) : undefined;
          return (
            <Label
              key={option.key}
              htmlFor={id}
              className="items-start rounded-lg border border-border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/10"
            >
              <RadioGroupItem id={id} value={option.key} className="mt-0.5" />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="flex items-center gap-2 leading-snug">
                  {swatch ? (
                    <span aria-hidden className="size-4 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />
                  ) : null}
                  <span>{option.name}</span>
                </span>
                {axis === "font" ? (
                  <span aria-hidden className="block text-lg" style={{ fontFamily: fontFamilyOf(shown, rootFontSans) }}>
                    Aa Bb Cc 123
                  </span>
                ) : null}
                {weight ? (
                  <span aria-hidden className="block text-sm text-muted-foreground" style={{ fontWeight: weight.semibold }}>
                    {WEIGHT_SAMPLE}
                  </span>
                ) : null}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function AppearanceReadOnly({ folder, nameOf }: { folder: Folder; nameOf: (id: string) => string | undefined }) {
  const { resolvedTheme } = useTheme();
  const eff = folder.effectiveAppearance;
  const axes: AppearanceAxis[] = ["palette", "font", "weight"];

  return (
    <CardContent>
      <dl className="grid gap-3 sm:grid-cols-3">
        {axes.map((axis) => {
          const key = eff[AXIS_KEY[axis]];
          const swatch = axis === "palette" ? swatchFor(key, resolvedTheme === "dark" ? "dark" : "light", catalog) : null;
          return (
            <div key={axis} className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">{AXIS_TITLE[axis]}</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                {swatch ? <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ backgroundColor: swatch }} /> : null}
                {nameOfOption(axis, key)}
              </dd>
              <dd className="text-xs text-muted-foreground">{sourceLabel(eff, axis, nameOf)}</dd>
            </div>
          );
        })}
      </dl>
    </CardContent>
  );
}
