"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "@/features/auth/api/auth-service";
import { queryKeys } from "@/lib/query-keys";

// `hasPassword`/`googleLinked` off GET /auth/me — used by ReauthDialog to
// decide which reauthentication method(s) to offer (see assistant module).
export function useCurrentUserQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getCurrentUser,
    enabled: options?.enabled,
    staleTime: 60_000,
  });
}
