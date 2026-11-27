"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FolderAppearanceCatalog } from "@/lib/appearance/catalog";
import catalogJson from "@/lib/appearance/folder-appearance-catalog.json";
import { toScopeAttributes } from "@/lib/appearance/scope";
import { isPreviewTakenOver } from "@/features/folders/lib/appearance-gate";
import { previewResetStyle, type ResolvedAppearance } from "@/features/folders/lib/appearance-options";
import type { EffectiveFolderAppearance } from "@/types/folder-appearance";

// JSON imports widen tuples (Oklch) to number[]; the shape is checked by catalog.test.ts.
const catalog = catalogJson as unknown as FolderAppearanceCatalog;

const noop = () => () => {};
const readRootFontSans = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim();

/** The app's own --font-sans (set by next/font on <html>), to restore the default font in the preview. */
export function useRootFontSans(): string {
  return React.useSyncExternalStore(noop, readRootFontSans, () => "");
}

/**
 * Temporarily flips the app theme. The previous choice (including "system")
 * is restored on the second click, when the component unmounts and on pagehide.
 */
function usePreviewThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const previous = React.useRef<string | null>(null);
  // Theme the preview itself applied; a different theme later means the person took over.
  const applied = React.useRef<string | null>(null);
  const setThemeRef = React.useRef(setTheme);

  React.useEffect(() => {
    setThemeRef.current = setTheme;
  }, [setTheme]);

  React.useEffect(() => {
    if (previous.current !== null && isPreviewTakenOver(theme, applied.current)) {
      previous.current = null;
      applied.current = null;
    }
  }, [theme]);

  React.useEffect(() => {
    const restore = () => {
      if (previous.current === null) return;
      setThemeRef.current(previous.current);
      previous.current = null;
      applied.current = null;
    };
    window.addEventListener("pagehide", restore);
    return () => {
      window.removeEventListener("pagehide", restore);
      restore();
    };
  }, []);

  const toggle = () => {
    if (previous.current === null) {
      previous.current = theme ?? "system";
      applied.current = resolvedTheme === "dark" ? "light" : "dark";
      setTheme(applied.current);
    } else {
      setTheme(previous.current);
      previous.current = null;
      applied.current = null;
    }
  };

  return { isDark: resolvedTheme === "dark", toggle };
}

interface FolderAppearancePreviewProps {
  resolved: ResolvedAppearance;
  // Saved effective appearance, only to complete the shape toScopeAttributes reads.
  base: EffectiveFolderAppearance;
}

/** One panel with real components under the draft's scope attributes (no portal host). */
export function FolderAppearancePreview({ resolved, base }: FolderAppearancePreviewProps) {
  const { isDark, toggle } = usePreviewThemeToggle();
  const rootFontSans = useRootFontSans();
  const attrs = toScopeAttributes({ ...base, ...resolved }, catalog);
  const style = previewResetStyle(resolved, catalog, isDark ? "dark" : "light", rootFontSans);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Prévia · modo {isDark ? "escuro" : "claro"}</p>
        <Button type="button" variant="outline" size="sm" onClick={toggle}>
          {isDark ? "Ver no modo claro" : "Ver no modo escuro"}
        </Button>
      </div>

      {/* Decorative sample: hidden from assistive tech and out of the tab order. */}
      <div
        aria-hidden
        {...attrs}
        style={style as React.CSSProperties}
        className="space-y-4 rounded-lg border border-border bg-background p-4 text-foreground"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold">Campanha de verão</p>
          <Button type="button" size="sm" tabIndex={-1}>
            Novo item
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card size="sm" className="gap-2">
            <CardContent className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">A fazer</p>
              <p className="text-sm font-semibold">Revisar arte</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge>Alta</Badge>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary">Design</span>
                <span className="text-muted-foreground">12/12</span>
              </div>
            </CardContent>
          </Card>
          <Card size="sm" className="gap-2">
            <CardContent className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Em andamento</p>
              <p className="text-sm font-semibold">Post do blog</p>
              <p className="text-xs">
                <span className="text-primary underline underline-offset-2">Abrir rascunho</span>
                <span className="text-muted-foreground"> · 3 comentários</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="border-b-2 border-primary pb-1 text-sm font-medium">Aba ativa</span>
          <Input
            tabIndex={-1}
            readOnly
            defaultValue="Campo com foco"
            className="h-8 w-44 border-ring ring-2 ring-ring"
          />
          <span className="text-sm text-muted-foreground">Texto secundário</span>
        </div>
      </div>
    </div>
  );
}
