"use client";

import { useQuery } from "@tanstack/react-query";
import { featureFlagsService } from "@/features/feature-flags/api/feature-flags-service";
import { queryKeys } from "@/lib/query-keys";

/**
 * The signed-in user's feature flags. Silent read: no toast on error, the
 * caller treats missing flags as off.
 */
export function useMyFeaturesQuery(
  workspaceId?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.featureFlags.mine(workspaceId ?? null),
    queryFn: () => featureFlagsService.getMine(workspaceId ?? undefined),
    select: (r) => r.features,
    // Matches the server-side flag cache TTL.
    staleTime: 30_000,
    retry: 1,
    enabled: options?.enabled,
  });
}
