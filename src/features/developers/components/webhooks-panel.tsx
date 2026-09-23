"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { WebhookEndpointList } from "@/features/developers/components/webhook-endpoint-list";
import { WebhookEndpointFormDialog } from "@/features/developers/components/webhook-endpoint-form-dialog";
import { WebhookDeliveriesSheet } from "@/features/developers/components/webhook-deliveries-sheet";
import { RevealSecretDialog } from "@/features/developers/components/reveal-secret-dialog";
import { useWebhookEndpointsQuery } from "@/features/developers/hooks/use-webhook-endpoints";
import type { WebhookEndpointDto } from "@/types/developer";

export function WebhooksPanel({ workspaceId }: { workspaceId: string }) {
  const endpointsQuery = useWebhookEndpointsQuery(workspaceId);
  const [formState, setFormState] = React.useState<{
    open: boolean;
    endpoint: WebhookEndpointDto | null;
  }>({ open: false, endpoint: null });
  const [deliveriesEndpoint, setDeliveriesEndpoint] = React.useState<WebhookEndpointDto | null>(
    null
  );
  const [revealSecret, setRevealSecret] = React.useState<string | null>(null);

  if (endpointsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (endpointsQuery.isError) {
    return <ErrorState error={endpointsQuery.error} onRetry={() => endpointsQuery.refetch()} />;
  }

  const endpoints = endpointsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Endpoints HTTPS que recebem uma entrega assinada por POST a cada evento do workspace.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormState({ open: true, endpoint: null })}>
          <Plus /> Novo webhook
        </Button>
      </div>

      <WebhookEndpointList
        workspaceId={workspaceId}
        endpoints={endpoints}
        onEdit={(endpoint) => setFormState({ open: true, endpoint })}
        onViewDeliveries={setDeliveriesEndpoint}
        onRotated={(rotated) => setRevealSecret(rotated.plainSigningSecret ?? null)}
      />

      <WebhookEndpointFormDialog
        key={formState.endpoint?.id ?? "create"}
        workspaceId={workspaceId}
        open={formState.open}
        onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}
        webhookEndpoint={formState.endpoint}
        onCreated={(endpoint) => setRevealSecret(endpoint.plainSigningSecret ?? null)}
      />

      <WebhookDeliveriesSheet
        key={deliveriesEndpoint?.id ?? "none"}
        workspaceId={workspaceId}
        endpoint={deliveriesEndpoint}
        onOpenChange={(open) => {
          if (!open) setDeliveriesEndpoint(null);
        }}
      />

      <RevealSecretDialog
        key={revealSecret ?? "hidden"}
        open={revealSecret !== null}
        onOpenChange={(open) => {
          if (!open) setRevealSecret(null);
        }}
        title="Segredo de assinatura gerado"
        description="Use este valor para verificar a assinatura HMAC de cada entrega (veja Documentação da API abaixo)."
        secret={revealSecret}
      />
    </div>
  );
}
