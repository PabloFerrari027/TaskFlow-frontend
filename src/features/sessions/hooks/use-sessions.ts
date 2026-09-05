"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sessionsService } from "@/features/sessions/api/sessions-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { clearSession, getSnapshot } from "@/lib/auth/token-store";

export function useSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.sessions.all(),
    queryFn: sessionsService.list,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionsService.revoke(sessionId),
    onSuccess: () => {
      toast.success("Sessão encerrada.");
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRevokeAllSessionsMutation() {
  return useMutation({
    mutationFn: sessionsService.revokeAll,
    onSuccess: (data) => {
      toast.success(`${data.revokedCount} sessão(ões) encerrada(s).`);
      clearSession();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useLogout() {
  const router = useRouter();

  return async () => {
    const sessionId = getSnapshot().sessionId;
    try {
      if (sessionId) {
        await sessionsService.revoke(sessionId);
      }
    } catch {
      // Best-effort: even if the server call fails (e.g. session already
      // expired), the local session must still be cleared below.
    } finally {
      clearSession();
      router.push("/login");
    }
  };
}
