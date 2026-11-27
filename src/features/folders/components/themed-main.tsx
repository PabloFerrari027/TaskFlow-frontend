"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { FolderAppearanceCatalog } from "@/lib/appearance/catalog";
import catalogJson from "@/lib/appearance/folder-appearance-catalog.json";
import { toScopeAttributes, type ScopeAttributes } from "@/lib/appearance/scope";
import {
  FolderPortalContainerProvider,
  useFolderAppearanceContext,
} from "@/features/folders/context/folder-appearance-context";
import { useFolderAppearanceEnabled } from "@/features/folders/hooks/use-folder-appearance-enabled";

// JSON imports widen tuples (Oklch) to number[]; the shape is checked by catalog.test.ts.
const catalog = catalogJson as unknown as FolderAppearanceCatalog;
const NO_ATTRS: ScopeAttributes = {};

/**
 * The dashboard <main>, carrying the active folder's scope attributes, plus a
 * twin host at the end of <body> for portals (dialogs, menus, tooltips) opened
 * from inside it. Default folders, disabled flag or opt-out: no attributes.
 */
export function ThemedMain({ className, children }: { className?: string; children: React.ReactNode }) {
  const active = useFolderAppearanceContext()?.active ?? null;
  const enabled = useFolderAppearanceEnabled(active?.workspaceId);
  const attrs = React.useMemo(
    () => (enabled && active ? toScopeAttributes(active.eff, catalog) : NO_ATTRS),
    [enabled, active],
  );
  const themed = Object.keys(attrs).length > 0;

  const [host, setHost] = React.useState<HTMLElement | null>(null);

  return (
    <main className={className} {...attrs}>
      <FolderPortalContainerProvider container={themed && host ? host : undefined}>
        {children}
      </FolderPortalContainerProvider>
      {/* `themed` needs an active folder, set in an effect: client only. */}
      {themed
        ? createPortal(<div ref={setHost} data-folder-portal-host="" {...attrs} />, document.body)
        : null}
    </main>
  );
}
