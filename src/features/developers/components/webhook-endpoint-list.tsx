"use client";

import * as React from "react";
import {
  AlertTriangle,
  ListTree,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  Webhook as WebhookIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { webhookEventLabel } from "@/features/developers/lib/developer-catalog";
import {
  usePingWebhookEndpointMutation,
  useRemoveWebhookEndpointMutation,
  useRotateWebhookSecretMutation,
  useToggleWebhookEndpointMutation,
} from "@/features/developers/hooks/use-webhook-endpoints";
import type { WebhookEndpointDto } from "@/types/developer";

// After this many consecutive terminal failures the backend auto-disables
// the endpoint (API.md § 22.4) — shown as a warning before it actually hits.
const FAILURE_WARNING_THRESHOLD = 5;

export function WebhookEndpointList({
  workspaceId,
  endpoints,
  onEdit,
  onViewDeliveries,
  onRotated,
}: {
  workspaceId: string;
  endpoints: WebhookEndpointDto[];
  onEdit: (endpoint: WebhookEndpointDto) => void;
  onViewDeliveries: (endpoint: WebhookEndpointDto) => void;
  onRotated: (endpoint: WebhookEndpointDto) => void;
}) {
  const toggleMutation = useToggleWebhookEndpointMutation(workspaceId);
  const removeMutation = useRemoveWebhookEndpointMutation(workspaceId);
  const rotateMutation = useRotateWebhookSecretMutation(workspaceId);
  const pingMutation = usePingWebhookEndpointMutation(workspaceId);
  const [rotatingId, setRotatingId] = React.useState<string | null>(null);

  if (endpoints.length === 0) {
    return (
      <EmptyState
        icon={<WebhookIcon className="size-6" />}
        title="Nenhum webhook cadastrado"
        description="Cadastre um endpoint HTTPS para receber os eventos deste workspace em tempo real."
      />
    );
  }

  function handleRotate(endpoint: WebhookEndpointDto) {
    setRotatingId(endpoint.id);
    rotateMutation.mutate(endpoint.id, {
      onSuccess: (rotated) => {
        onRotated(rotated);
        setRotatingId(null);
      },
      onError: () => setRotatingId(null),
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Endpoint</TableHead>
          <TableHead>Eventos</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-40" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {endpoints.map((endpoint) => (
          <TableRow key={endpoint.id}>
            <TableCell className="max-w-64 whitespace-normal">
              <div className="break-all font-medium text-foreground">{endpoint.url}</div>
              {endpoint.description ? (
                <div className="text-xs text-muted-foreground">{endpoint.description}</div>
              ) : null}
            </TableCell>
            <TableCell>
              <div className="flex max-w-56 flex-wrap gap-1">
                {endpoint.events.slice(0, 3).map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {webhookEventLabel(event)}
                  </Badge>
                ))}
                {endpoint.events.length > 3 ? (
                  <Badge variant="outline" className="text-xs">
                    +{endpoint.events.length - 3}
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  checked={endpoint.active}
                  disabled={toggleMutation.isPending}
                  onCheckedChange={(active) =>
                    toggleMutation.mutate({ webhookEndpointId: endpoint.id, active })
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {endpoint.active ? "Ativo" : "Pausado"}
                </span>
              </div>
              {endpoint.active && endpoint.consecutiveFailureCount >= FAILURE_WARNING_THRESHOLD ? (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3" />
                  {endpoint.consecutiveFailureCount} falhas seguidas
                </div>
              ) : null}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Ver entregas"
                  onClick={() => onViewDeliveries(endpoint)}
                >
                  <ListTree />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Enviar ping de teste"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate(endpoint.id)}
                >
                  <Send />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => onEdit(endpoint)}>
                  <Pencil />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Girar segredo"
                      disabled={rotatingId === endpoint.id}
                    >
                      <RefreshCw />
                    </Button>
                  }
                  variant="default"
                  title="Girar segredo de assinatura"
                  description="Um novo segredo será gerado e o antigo deixará de validar entregas imediatamente."
                  confirmLabel="Girar segredo"
                  isLoading={rotatingId === endpoint.id}
                  onConfirm={() => handleRotate(endpoint)}
                />
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon-sm" title="Remover">
                      <Trash2 className="text-destructive" />
                    </Button>
                  }
                  title="Remover webhook"
                  description="O endpoint e todo o histórico de entregas serão apagados. Esta ação não pode ser desfeita."
                  confirmLabel="Remover"
                  isLoading={removeMutation.isPending}
                  onConfirm={() => removeMutation.mutate(endpoint.id)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
