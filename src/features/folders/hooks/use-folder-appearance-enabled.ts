"use client";

import { useMyFeaturesQuery } from "@/features/feature-flags/hooks/use-my-features";
import { readIgnoreFolderAppearance } from "@/features/folders/lib/folder-appearance-pref";

/**
 * Whether folder appearance is applied for this reader: the `folders.appearance`
 * flag must be on and the local opt-out must not be set. Any doubt means off.
 */
export function useFolderAppearanceEnabled(workspaceId: string | null | undefined): boolean {
  const { data: features } = useMyFeaturesQuery(workspaceId);
  return features?.["folders.appearance"] === true && !readIgnoreFolderAppearance();
}
