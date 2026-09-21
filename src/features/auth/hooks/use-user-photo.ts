"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/api/auth-service";
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/lib/auth/auth-context";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";

/**
 * Profile photo of any user as a URL ready for `<AvatarImage src>`, or `null`
 * (no photo / still loading — the avatar falls back to initials either way).
 *
 * Only the current user's `hasPhoto` is known (GET /auth/me), so for them the
 * request is skipped when it's false; for everyone else a 404 is cached as
 * `null` and the query isn't retried.
 */
export function useUserPhotoUrl(userId: string | null | undefined) {
  const { userId: currentUserId } = useAuth();
  const isSelf = !!userId && userId === currentUserId;
  const { data: currentUser } = useCurrentUserQuery({ enabled: isSelf });

  const query = useQuery({
    queryKey: queryKeys.users.photo(userId ?? ""),
    queryFn: () => authService.getUserPhoto(userId!),
    enabled: !!userId && (!isSelf || currentUser?.hasPhoto === true),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return query.data ?? null;
}

export function useUploadPhotoMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: authService.uploadPhoto,
    onSuccess: () => {
      // `hasPhoto` may flip to true, and the cached binary is now stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.photo(userId) });
      }
      toast.success("Foto de perfil atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
