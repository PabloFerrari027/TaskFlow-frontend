"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { webhookDeliveriesService } from "@/features/developers/api/developers-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";

export function useWebhookDeliveriesQuery(
  workspaceId: string,
  webhookEndpointId: string,
  page: number
) {
  return useQuery({
    queryKey: queryKeys.developers.webhookDeliveries(webhookEndpointId, page),
    queryFn: () =>
      webhookDeliveriesService.list(workspaceId, webhookEndpointId, { page }),
    enabled: Boolean(webhookEndpointId),
  });
}

export function useRedeliverWebhookMutation(workspaceId: string, webhookEndpointId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) =>
      webhookDeliveriesService.redeliver(workspaceId, webhookEndpointId, deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.developers.webhookDeliveries(webhookEndpointId),
      });
      toast.success("Nova tentativa de entrega enfileirada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
