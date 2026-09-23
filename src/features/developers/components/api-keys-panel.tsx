"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ApiKeyList } from "@/features/developers/components/api-key-list";
import { ApiKeyFormDialog } from "@/features/developers/components/api-key-form-dialog";
import { RevealSecretDialog } from "@/features/developers/components/reveal-secret-dialog";
import { useApiKeysQuery } from "@/features/developers/hooks/use-api-keys";
import type { ApiKeyDto } from "@/types/developer";

export function ApiKeysPanel({ workspaceId }: { workspaceId: string }) {
  const apiKeysQuery = useApiKeysQuery(workspaceId);
  const [formState, setFormState] = React.useState<{ open: boolean; apiKey: ApiKeyDto | null }>({
    open: false,
    apiKey: null,
  });
  const [revealSecret, setRevealSecret] = React.useState<string | null>(null);

  if (apiKeysQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (apiKeysQuery.isError) {
    return <ErrorState error={apiKeysQuery.error} onRetry={() => apiKeysQuery.refetch()} />;
  }

  const apiKeys = apiKeysQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">Chaves de API</h3>
          <p className="text-sm text-muted-foreground">
            Credenciais de máquina para sistemas externos se autenticarem neste workspace.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormState({ open: true, apiKey: null })}>
          <Plus /> Nova chave
        </Button>
      </div>

      <ApiKeyList
        workspaceId={workspaceId}
        apiKeys={apiKeys}
        onEdit={(apiKey) => setFormState({ open: true, apiKey })}
        onRotated={(rotated) => setRevealSecret(rotated.plainKey ?? null)}
      />

      <ApiKeyFormDialog
        key={formState.apiKey?.id ?? "create"}
        workspaceId={workspaceId}
        open={formState.open}
        onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}
        apiKey={formState.apiKey}
        onCreated={(key) => setRevealSecret(key.plainKey ?? null)}
      />

      <RevealSecretDialog
        key={revealSecret ?? "hidden"}
        open={revealSecret !== null}
        onOpenChange={(open) => {
          if (!open) setRevealSecret(null);
        }}
        title="Chave de API criada"
        description="Use este valor no cabeçalho de autenticação dos seus sistemas."
        secret={revealSecret}
      />
    </div>
  );
}
