"use client";

import * as React from "react";
import { AlertTriangle, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";
import { useItemPanel } from "@/features/items/hooks/use-item-panel";
import { RecurringItemDialog } from "@/features/recurring-items/components/recurring-item-dialog";
import {
  useDeleteRecurringItemMutation,
  useRecurringItemsQuery,
  useUpdateRecurringItemMutation,
} from "@/features/recurring-items/hooks/use-recurring-items";
import { describeSchedule, formatOccurrence } from "@/features/recurring-items/lib/schedule-text";
import type { RecurrenceDisabledReason, ItemRecurrence } from "@/types/recurrence";

const MAX_RECURRENCES = 50;

const DISABLED_REASON: Record<RecurrenceDisabledReason, string> = {
  AUTHORITY_LOST:
    "Foi pausada sozinha porque quem a criou não tem mais acesso a esta pasta. Ligue de novo para retomar (ela passa a contar com você).",
  FOLDER_INACTIVE: "Foi pausada sozinha porque a pasta foi arquivada.",
};

function RecurrenceRow({
  recurrence,
  folderId,
  canEdit,
  onEdit,
}: {
  recurrence: ItemRecurrence;
  folderId: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const updateMutation = useUpdateRecurringItemMutation(folderId);
  const deleteMutation = useDeleteRecurringItemMutation(folderId);
  const { openItem } = useItemPanel();

  return (
    <li className="space-y-2 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{recurrence.title}</p>
          <p className="text-sm text-muted-foreground">{describeSchedule(recurrence.schedule)}</p>
          <p className="text-xs text-muted-foreground">
            {recurrence.enabled && recurrence.nextRunAt
              ? `Próxima: ${formatOccurrence(recurrence.nextRunAt)}`
              : recurrence.enabled
                ? "Sem próximas datas (a repetição terminou)."
                : "Pausada"}
            {recurrence.occurrenceCount > 0
              ? ` · já criou ${recurrence.occurrenceCount === 1 ? "1 item" : `${recurrence.occurrenceCount} itens`}`
              : ""}
            {recurrence.lastItemId ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="underline-offset-2 hover:underline"
                  onClick={() => openItem(recurrence.lastItemId!)}
                >
                  ver a última
                </button>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <MemberAvatar userId={recurrence.createdBy} className="mr-1" />
          <Switch
            checked={recurrence.enabled}
            disabled={!canEdit || updateMutation.isPending}
            onCheckedChange={(enabled) =>
              updateMutation.mutate({ recurrenceId: recurrence.id, payload: { enabled } })
            }
            aria-label={recurrence.enabled ? "Pausar repetição" : "Ligar repetição"}
            title={recurrence.enabled ? "Pausar" : "Ligar"}
          />
          {canEdit ? (
            <>
              <Button variant="ghost" size="icon-sm" aria-label="Editar" title="Editar" onClick={onEdit}>
                <Pencil />
              </Button>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover"
                    title="Remover"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                }
                title={`Remover “${recurrence.title}”?`}
                description="Nenhum item novo será criado. Os que ela já criou continuam na pasta."
                confirmLabel="Remover"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate(recurrence.id)}
              />
            </>
          ) : null}
        </div>
      </div>
      {!recurrence.enabled && recurrence.disabledReason ? (
        <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {DISABLED_REASON[recurrence.disabledReason]}
        </p>
      ) : null}
      {recurrence.lastError ? (
        <p className="text-xs text-muted-foreground">
          Aviso da última vez: {recurrence.lastError}
        </p>
      ) : null}
    </li>
  );
}

export function RecurringItemsList({ folderId }: { folderId: string }) {
  const { userId } = useAuth();
  const { canManage } = useFolderPermission(folderId);
  const recurrencesQuery = useRecurringItemsQuery(folderId);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ItemRecurrence | null>(null);
  const recurrences = recurrencesQuery.data ?? [];
  const atLimit = recurrences.length >= MAX_RECURRENCES;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens repetidos</CardTitle>
        <CardDescription>
          Coisas que se repetem — como “Pagar o aluguel” todo dia 5 ou “Compras do mercado” todo
          sábado. O TaskFlow cria o item sozinho em cada data, até 1 minuto depois do horário.
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            disabled={atLimit}
            title={atLimit ? "A pasta já tem 50 itens repetidos" : undefined}
          >
            <Plus /> Nova repetição
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {recurrencesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : recurrencesQuery.isError ? (
          <ErrorState error={recurrencesQuery.error} onRetry={() => recurrencesQuery.refetch()} />
        ) : recurrences.length === 0 ? (
          <EmptyState
            icon={<Repeat className="size-6" />}
            title="Nenhum item repetido"
            description="Crie uma para não precisar lembrar de cadastrar o mesmo item toda vez."
          />
        ) : (
          <ul className="divide-y">
            {recurrences.map((recurrence) => (
              <RecurrenceRow
                key={recurrence.id}
                recurrence={recurrence}
                folderId={folderId}
                canEdit={canManage || recurrence.createdBy === userId}
                onEdit={() => setEditing(recurrence)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      {creating ? (
        <RecurringItemDialog folderId={folderId} open onOpenChange={setCreating} />
      ) : null}
      {editing ? (
        <RecurringItemDialog
          key={editing.id}
          folderId={folderId}
          recurrence={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </Card>
  );
}
