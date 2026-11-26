import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys.ts";
import type { Folder } from "@/types/folder";

/**
 * Merges a folder response into the cached detail. Responses that omit
 * effectiveAppearance (rename, archive, move) must not wipe the cached one.
 */
export function mergeFolderDetail(prev: Folder | undefined, next: Folder): Folder {
  if (next.effectiveAppearance || !prev?.effectiveAppearance) return next;
  return { ...next, effectiveAppearance: prev.effectiveAppearance };
}

export function setFolderDetail(qc: QueryClient, folder: Folder): void {
  qc.setQueryData<Folder>(queryKeys.folders.detail(folder.id), (prev) =>
    mergeFolderDetail(prev, folder)
  );
}

/**
 * Matches only `["folders", <id>]` detail queries of the workspace. Used to
 * refresh sub-folders that inherit their appearance from a folder above.
 */
export function isWorkspaceFolderDetail(
  query: { queryKey: readonly unknown[]; state: { data?: unknown } },
  workspaceId: string
): boolean {
  if (query.queryKey.length !== 2 || query.queryKey[0] !== "folders") return false;
  const data = query.state.data as { workspaceId?: unknown } | null | undefined;
  return data?.workspaceId === workspaceId;
}
