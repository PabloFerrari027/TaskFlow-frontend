"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { WebhookDeliveryStatusBadge } from "@/components/shared/status-badge";
import { webhookEventLabel } from "@/features/developers/lib/developer-catalog";
import {
  useRedeliverWebhookMutation,
  useWebhookDeliveriesQuery,
} from "@/features/developers/hooks/use-webhook-deliveries";
import { formatDateTime } from "@/lib/format";
import type { WebhookEndpointDto } from "@/types/developer";

export function WebhookDeliveriesSheet({
  workspaceId,
  endpoint,
  onOpenChange,
}: {
  workspaceId: string;
  endpoint: WebhookEndpointDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = React.useState(1);
  const webhookEndpointId = endpoint?.id ?? "";
  const deliveriesQuery = useWebhookDeliveriesQuery(workspaceId, webhookEndpointId, page);
  const redeliverMutation = useRedeliverWebhookMutation(workspaceId, webhookEndpointId);

  return (
    <Sheet open={endpoint !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>Entregas do webhook</SheetTitle>
          <SheetDescription className="break-all">{endpoint?.url}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {deliveriesQuery.isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : deliveriesQuery.isError ? (
            <ErrorState error={deliveriesQuery.error} onRetry={() => deliveriesQuery.refetch()} />
          ) : (deliveriesQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              title="Nenhuma entrega ainda"
              description="Assim que um evento assinado acontecer (ou você enviar um ping), as tentativas aparecerão aqui."
            />
          ) : (
            <div className="space-y-2">
              {deliveriesQuery.data?.data.map((delivery) => (
                <div key={delivery.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {webhookEventLabel(delivery.eventName)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(delivery.createdAt)}
                      </p>
                    </div>
                    <WebhookDeliveryStatusBadge status={delivery.status} />
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>Tentativas: {delivery.attemptCount}</p>
                    {delivery.lastResponseStatus !== null ? (
                      <p>Última resposta: HTTP {delivery.lastResponseStatus}</p>
                    ) : null}
                    {delivery.lastError ? (
                      <p className="text-destructive">{delivery.lastError}</p>
                    ) : null}
                  </div>
                  {delivery.status === "FAILED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      disabled={redeliverMutation.isPending}
                      onClick={() => redeliverMutation.mutate(delivery.id)}
                    >
                      <RotateCcw /> Reenviar
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {deliveriesQuery.data ? (
          <div className="border-t border-border/60 p-4">
            <Pager
              meta={deliveriesQuery.data.meta}
              onPageChange={setPage}
              isLoading={deliveriesQuery.isFetching}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
