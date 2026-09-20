"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "@/features/auth/api/auth-service";
import { useAuth } from "@/lib/auth/auth-context";
import { getInitialsFromEmail, getInitialsFromName } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

// `name`/`hasPassword`/`googleLinked` off GET /auth/me — `hasPassword` and
// `googleLinked` are used by ReauthDialog to decide which reauthentication
// method(s) to offer (see assistant module).
export function useCurrentUserQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getCurrentUser,
    enabled: options?.enabled,
    staleTime: 60_000,
  });
}

/**
 * How to label the signed-in user in the UI: their name, or the JWT e-mail
 * while the name loads / for accounts that have none (`name: null`). The JWT
 * carries no name, so it comes from GET /auth/me.
 */
export function useSelfIdentity(options?: { enabled?: boolean }) {
  const { email } = useAuth();
  const { data } = useCurrentUserQuery(options);

  const name = data?.name?.trim() || null;
  const label = name ?? data?.email ?? email;
  const initials = name
    ? getInitialsFromName(name)
    : label
      ? getInitialsFromEmail(label)
      : null;

  return { name, label, initials };
}
