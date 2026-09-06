"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientsService } from "@/features/admin/api/clients-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { ListClientsParams } from "@/types/client";

export function useClientsQuery(params: ListClientsParams) {
  return useQuery({
    queryKey: queryKeys.clients.all(params),
    queryFn: () => clientsService.list(params),
    placeholderData: (previous) => previous,
  });
}

// The backend has no endpoint that exposes the caller's platform role, and
// RolesGuard re-checks it server-side on every request rather than putting it
// in the JWT — so we infer SUPER_ADMIN access from whether this admin-only
// call succeeds (a non-admin gets a 403).
export function useIsSuperAdminQuery() {
  return useQuery({
    queryKey: queryKeys.clients.isSuperAdmin(),
    queryFn: () => clientsService.list({ limit: 1 }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuspendClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => clientsService.suspend(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() });
      toast.success("Cliente suspenso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useActivateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => clientsService.activate(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() });
      toast.success("Cliente reativado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCloseClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => clientsService.close(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() });
      toast.success("Conta encerrada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
