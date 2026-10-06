"use client";

import * as React from "react";
import { Archive, ListTree, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useArchiveCustomFieldMutation,
  useCustomFieldsQuery,
} from "@/features/custom-fields/hooks/use-custom-fields";
import { CUSTOM_FIELD_TYPE_LABEL } from "@/features/custom-fields/schemas";
import { CreateCustomFieldDialog } from "@/features/custom-fields/components/create-custom-field-dialog";
import { EditOptionsDialog } from "@/features/custom-fields/components/edit-options-dialog";
import { OptionChip } from "@/features/custom-fields/components/option-chip";
import { getOptionColor } from "@/features/custom-fields/lib/option-colors";
import type { CustomFieldDefinition } from "@/types/custom-field";

const SELECT_TYPES = ["SINGLE_SELECT", "MULTI_SELECT"];

export function CustomFieldsList({
  folderId,
  canManage,
}: {
  folderId: string;
  canManage: boolean;
}) {
  const fieldsQuery = useCustomFieldsQuery(folderId);
  const archiveMutation = useArchiveCustomFieldMutation(folderId);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingField, setEditingField] = React.useState<CustomFieldDefinition | null>(null);

  return (
    <div className="space-y-4">
      <RoleGate allowed={canManage}>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Novo campo
          </Button>
        </div>
      </RoleGate>

      {fieldsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : fieldsQuery.isError ? (
        <ErrorState error={fieldsQuery.error} onRetry={() => fieldsQuery.refetch()} />
      ) : !fieldsQuery.data || fieldsQuery.data.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal className="size-6" />}
          title="Nenhum campo extra criado"
          description="Crie campos como Cliente ou Valor para guardar mais informações em cada item."
          action={
            <RoleGate allowed={canManage}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Novo campo
              </Button>
            </RoleGate>
          }
        />
      ) : (
        <div className="space-y-2">
          {fieldsQuery.data.map((definition) => (
            <Card key={definition.id} className="flex-row items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{definition.name}</span>
                  <Badge variant="secondary">{CUSTOM_FIELD_TYPE_LABEL[definition.type]}</Badge>
                  {definition.archived ? <Badge variant="outline">Arquivado</Badge> : null}
                </div>
                {definition.options && definition.options.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <ListTree className="size-3.5 shrink-0 text-muted-foreground" />
                    {definition.options.map((option) => (
                      <OptionChip
                        key={option}
                        label={option}
                        color={getOptionColor(definition, option)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {canManage && !definition.archived ? (
                <div className="flex shrink-0 items-center gap-1">
                  {SELECT_TYPES.includes(definition.type) ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar opções e cores"
                      title="Editar opções e cores"
                      onClick={() => setEditingField(definition)}
                    >
                      <Pencil />
                    </Button>
                  ) : null}
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Arquivar campo" title="Arquivar campo">
                        <Archive className="text-destructive" />
                      </Button>
                    }
                    title="Arquivar campo"
                    description="Valores já preenchidos permanecem, mas o campo não poderá mais ser usado ou editado."
                    confirmLabel="Arquivar"
                    isLoading={archiveMutation.isPending}
                    onConfirm={() => archiveMutation.mutate(definition.id)}
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <CreateCustomFieldDialog folderId={folderId} open={createOpen} onOpenChange={setCreateOpen} />
      {editingField ? (
        <EditOptionsDialog
          key={editingField.id}
          folderId={folderId}
          definition={editingField}
          open={Boolean(editingField)}
          onOpenChange={(open) => !open && setEditingField(null)}
        />
      ) : null}
    </div>
  );
}
