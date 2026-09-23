"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { webhookEndpointsService } from "@/features/developers/api/developers-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type {
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
} from "@/types/developer";

// Not cacheable long-term: `active`/`consecutiveFailureCount` change on their
// own in the background (delivery worker / kill switch).
export function useWebhookEndpointsQuery(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.developers.webhookEndpoints(workspaceId),
    queryFn: () => webhookEndpointsService.list(workspaceId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
    staleTime: 0,
  });
}

export function useCreateWebhookEndpointMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWebhookEndpointRequest) =>
      webhookEndpointsService.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookEndpoints(workspaceId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateWebhookEndpointMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      webhookEndpointId,
      payload,
    }: {
      webhookEndpointId: string;
      payload: UpdateWebhookEndpointRequest;
    }) => webhookEndpointsService.update(workspaceId, webhookEndpointId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookEndpoints(workspaceId),
      });
      toast.success("Endpoint atualizado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Separate from the edit mutation only so the toast can say what happened —
// both hit the same PATCH (`active` is also how a manual reactivation clears
// the failure counter after fixing whatever the kill switch tripped on).
export function useToggleWebhookEndpointMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookEndpointId, active }: { webhookEndpointId: string; active: boolean }) =>
      webhookEndpointsService.update(workspaceId, webhookEndpointId, { active }),
    onSuccess: (endpoint) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookEndpoints(workspaceId),
      });
      toast.success(endpoint.active ? "Endpoint reativado." : "Endpoint pausado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveWebhookEndpointMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookEndpointId: string) =>
      webhookEndpointsService.remove(workspaceId, webhookEndpointId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookEndpoints(workspaceId),
      });
      toast.success("Endpoint removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRotateWebhookSecretMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookEndpointId: string) =>
      webhookEndpointsService.rotateSecret(workspaceId, webhookEndpointId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookEndpoints(workspaceId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePingWebhookEndpointMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookEndpointId: string) =>
      webhookEndpointsService.ping(workspaceId, webhookEndpointId),
    onSuccess: (_delivery, webhookEndpointId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookDeliveries(webhookEndpointId),
      });
      toast.success("Ping enviado. Confira o resultado na lista de entregas.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
