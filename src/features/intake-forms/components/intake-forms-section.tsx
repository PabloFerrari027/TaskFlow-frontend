"use client";

import * as React from "react";
import { Copy, ExternalLink, FileInput, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatRelativeTime } from "@/lib/format";
import { IntakeFormDialog } from "@/features/intake-forms/components/intake-form-dialog";
import {
  useDeleteIntakeFormMutation,
  useIntakeFormsQuery,
  useRegenerateIntakeFormTokenMutation,
  useUpdateIntakeFormMutation,
} from "@/features/intake-forms/hooks/use-intake-forms";
import type { IntakeForm } from "@/types/intake-form";

function publicUrl(form: IntakeForm) {
  return typeof window === "undefined" ? form.publicPath : `${window.location.origin}${form.publicPath}`;
}

function FormRow({ form, folderId, onEdit }: { form: IntakeForm; folderId: string; onEdit: () => void }) {
  const updateMutation = useUpdateIntakeFormMutation(folderId);
  const regenerateMutation = useRegenerateIntakeFormTokenMutation(folderId);
  const deleteMutation = useDeleteIntakeFormMutation(folderId);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl(form));
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar. Abra o formulário e copie o endereço.");
    }
  }

  return (
    <li className="space-y-2 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{form.name}</p>
          <p className="text-xs text-muted-foreground">
            {form.fields.length === 1 ? "1 pergunta" : `${form.fields.length} perguntas`} ·{" "}
            {form.submissionCount === 0
              ? "nenhuma resposta ainda"
              : `${form.submissionCount === 1 ? "1 resposta" : `${form.submissionCount} respostas`}, a última ${formatRelativeTime(form.lastSubmittedAt!)}`}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {form.isActive ? "Recebendo respostas" : "Desligado"}
          <Switch
            checked={form.isActive}
            disabled={updateMutation.isPending}
            onCheckedChange={(isActive) => updateMutation.mutate({ formId: form.id, payload: { isActive } })}
            aria-label={form.isActive ? "Desligar formulário" : "Ligar formulário"}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" onClick={copyLink} disabled={!form.isActive}>
          <Copy /> Copiar link
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <a href={form.publicPath} target="_blank" rel="noreferrer">
            <ExternalLink /> Abrir
          </a>
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil /> Editar
        </Button>
        <ConfirmDialog
          variant="default"
          trigger={
            <Button size="sm" variant="ghost">
              <RefreshCw /> Trocar link
            </Button>
          }
          title="Gerar um link novo?"
          description="O link atual para de funcionar na hora. Use se ele foi parar onde não devia."
          confirmLabel="Gerar link novo"
          isLoading={regenerateMutation.isPending}
          onConfirm={() => regenerateMutation.mutate(form.id)}
        />
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 /> Apagar
            </Button>
          }
          title={`Apagar “${form.name}”?`}
          description="O link para de funcionar. Os itens que o formulário já criou continuam na pasta."
          confirmLabel="Apagar"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(form.id)}
        />
      </div>
    </li>
  );
}

export function IntakeFormsSection({ folderId }: { folderId: string }) {
  const formsQuery = useIntakeFormsQuery(folderId);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<IntakeForm | null>(null);
  const forms = formsQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulários de pedidos</CardTitle>
        <CardDescription>
          Um link que qualquer pessoa preenche, sem conta no TaskFlow — clientes, colegas de outra
          área. Cada resposta vira um item aqui.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus /> Novo formulário
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {formsQuery.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : formsQuery.isError ? (
          <ErrorState error={formsQuery.error} onRetry={() => formsQuery.refetch()} />
        ) : forms.length === 0 ? (
          <EmptyState icon={<FileInput className="size-6" />} title="Nenhum formulário ainda" />
        ) : (
          <ul className="divide-y">
            {forms.map((form) => (
              <FormRow key={form.id} form={form} folderId={folderId} onEdit={() => setEditing(form)} />
            ))}
          </ul>
        )}
      </CardContent>

      {creating ? <IntakeFormDialog folderId={folderId} open onOpenChange={setCreating} /> : null}
      {editing ? (
        <IntakeFormDialog
          key={editing.id}
          folderId={folderId}
          form={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </Card>
  );
}
