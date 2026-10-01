"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchService } from "@/features/search/api/search-service";
import { queryKeys } from "@/lib/query-keys";
import type { SearchParams } from "@/types/search";

export const MIN_SEARCH_LENGTH = 2;

export function useWorkspaceSearchQuery(workspaceId: string | null, params: SearchParams) {
  const q = params.q.trim();
  return useQuery({
    queryKey: queryKeys.search.results(workspaceId ?? "", { ...params, q }),
    queryFn: () => searchService.search(workspaceId!, { ...params, q }),
    enabled: !!workspaceId && q.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
