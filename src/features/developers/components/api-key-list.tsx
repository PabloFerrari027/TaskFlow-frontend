"use client";

import * as React from "react";
import { KeyRound, Pencil, RefreshCw, Trash2 } from "lucide-react";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiKeyEnvironmentBadge } from "@/components/shared/status-badge";
import { API_KEY_SCOPE_LABEL } from "@/features/developers/lib/developer-catalog";
import {
  useRevokeApiKeyMutation,
  useRotateApiKeyMutation,
} from "@/features/developers/hooks/use-api-keys";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { ApiKeyDto } from "@/types/developer";

export function ApiKeyList({
  workspaceId,
  apiKeys,
  onEdit,
  onRotated,
}: {
  workspaceId: string;
  apiKeys: ApiKeyDto[];
  onEdit: (apiKey: ApiKeyDto) => void;
  onRotated: (apiKey: ApiKeyDto) => void;
}) {
  const rotateMutation = useRotateApiKeyMutation(workspaceId);
  const revokeMutation = useRevokeApiKeyMutation(workspaceId);
  const [rotatingId, setRotatingId] = React.useState<string | null>(null);

  if (apiKeys.length === 0) {
    return (
      <EmptyState
        icon={<KeyRound className="size-6" />}
        title="Nenhuma chave de API"
        description="Crie uma chave para permitir que sistemas externos se autentiquem neste workspace."
      />
    );
  }

  function handleRotate(apiKey: ApiKeyDto) {
    setRotatingId(apiKey.id);
    rotateMutation.mutate(apiKey.id, {
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
          <TableHead>Nome</TableHead>
          <TableHead>Ambiente</TableHead>
          <TableHead>Chave</TableHead>
          <TableHead>Escopos</TableHead>
          <TableHead>Último uso</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {apiKeys.map((apiKey) => {
          const revoked = Boolean(apiKey.revokedAt);
          const expired = Boolean(apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date());

          return (
            <TableRow key={apiKey.id} className={revoked ? "opacity-60" : undefined}>
              <TableCell>
                <div className="font-medium text-foreground">{apiKey.name}</div>
                {apiKey.description ? (
                  <div className="text-xs text-muted-foreground">{apiKey.description}</div>
                ) : null}
              </TableCell>
              <TableCell>
                <ApiKeyEnvironmentBadge environment={apiKey.environment} />
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {apiKey.keyPrefix}…
                </code>
              </TableCell>
              <TableCell>
                <div className="flex max-w-56 flex-wrap gap-1">
                  {apiKey.scopes.map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {API_KEY_SCOPE_LABEL[scope]}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {apiKey.lastUsedAt ? formatRelativeTime(apiKey.lastUsedAt) : "Nunca usada"}
              </TableCell>
              <TableCell>
                {revoked ? (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Revogada
                  </Badge>
                ) : expired ? (
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                    Expirada
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    Ativa
                  </Badge>
                )}
                {apiKey.expiresAt && !revoked && !expired ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Expira em {formatDate(apiKey.expiresAt)}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                {!revoked ? (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Editar"
                      onClick={() => onEdit(apiKey)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Girar segredo"
                          disabled={rotatingId === apiKey.id}
                        >
                          <RefreshCw />
                        </Button>
                      }
                      variant="default"
                      title="Girar segredo da chave"
                      description="Um novo segredo será gerado e o antigo deixará de funcionar imediatamente, sem período de transição."
                      confirmLabel="Girar segredo"
                      isLoading={rotatingId === apiKey.id}
                      onConfirm={() => handleRotate(apiKey)}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" title="Revogar">
                          <Trash2 className="text-destructive" />
                        </Button>
                      }
                      title="Revogar chave de API"
                      description={`"${apiKey.name}" deixará de funcionar imediatamente. Esta ação não pode ser desfeita.`}
                      confirmLabel="Revogar"
                      isLoading={revokeMutation.isPending}
                      onConfirm={() => revokeMutation.mutate(apiKey.id)}
                    />
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
