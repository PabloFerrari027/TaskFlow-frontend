"use client";

import * as React from "react";
import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user";
import { queryKeys } from "@/lib/query-keys";
import type { EntityKind, EntityNameLookup } from "@/features/assistant/lib/describe-params";
import type { Workspace } from "@/types/workspace";

type Named = { id: string; name?: string | null; title?: string | null };

// Cached query data comes in three shapes: a single entity, a plain array, or
// a paginated `{ data: [] }` envelope.
function entitiesIn(data: unknown): Named[] {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data)) return data as Named[];
  const envelope = (data as { data?: unknown }).data;
  if (Array.isArray(envelope)) return envelope as Named[];
  return "id" in data ? [data as Named] : [];
}

function findCachedName(queryClient: QueryClient, prefix: QueryKey, id: string): string | null {
  for (const [, data] of queryClient.getQueriesData({ queryKey: prefix })) {
    const match = entitiesIn(data).find((entity) => entity?.id === id);
    const label = match?.title ?? match?.name;
    if (label) return label;
  }
  return null;
}

/**
 * Names for the ids an assistant action carries, read from what this client
 * already has in cache (no extra requests): the card renders immediately and
 * an id that isn't loaded simply stays shortened.
 */
export function useEntityNameLookup(workspaceId: string): EntityNameLookup {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUserQuery();

  return React.useCallback(
    (kind: EntityKind, id: string) => {
      switch (kind) {
        case "folder":
          return findCachedName(queryClient, queryKeys.folders.root(), id);
        case "item":
          return findCachedName(queryClient, queryKeys.items.root(), id);
        case "section":
          return findCachedName(queryClient, queryKeys.sections.byFolderAll(), id);
        case "status":
          return findCachedName(queryClient, queryKeys.statuses.byFolderAll(), id);
        case "person": {
          if (me && me.id === id) return me.name ? `${me.name} (você)` : "Você";
          const workspace = queryClient.getQueryData<Workspace>(queryKeys.workspaces.detail(workspaceId));
          return workspace?.members.find((member) => member.userId === id)?.name ?? null;
        }
      }
    },
    [queryClient, me, workspaceId]
  );
}
