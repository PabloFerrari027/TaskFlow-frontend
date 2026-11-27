"use client";

import { useSyncExternalStore } from "react";
import { useMyFeaturesQuery } from "@/features/feature-flags/hooks/use-my-features";
import {
  getIgnoreFolderAppearanceServerSnapshot,
  getIgnoreFolderAppearanceSnapshot,
  subscribeIgnoreFolderAppearance,
} from "@/features/folders/lib/folder-appearance-pref";

/** Reactive "use always the default appearance" choice of this browser. */
export function useIgnoreFolderAppearance(): boolean {
  return useSyncExternalStore(
    subscribeIgnoreFolderAppearance,
    getIgnoreFolderAppearanceSnapshot,
    getIgnoreFolderAppearanceServerSnapshot,
  );
}

/**
 * Whether folder appearance is applied for this reader: the `folders.appearance`
 * flag must be on and the local opt-out must not be set. A missing flag means
 * off; a storage read error means the opt-out is not set.
 */
export function useFolderAppearanceEnabled(workspaceId: string | null | undefined): boolean {
  const { data: features } = useMyFeaturesQuery(workspaceId);
  const ignore = useIgnoreFolderAppearance();
  return features?.["folders.appearance"] === true && !ignore;
}
