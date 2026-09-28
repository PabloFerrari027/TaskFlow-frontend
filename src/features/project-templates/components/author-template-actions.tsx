"use client";

import * as React from "react";
import { EyeOff, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getErrorCode } from "@/lib/errors";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import {
  useDeleteProjectTemplateMutation,
  usePublishProjectTemplateMutation,
  useUnpublishProjectTemplateMutation,
  useUpdateProjectTemplateListingMutation,
} from "@/features/project-templates/hooks/use-project-templates";
import { centsToReaisInput, toListingRequest } from "@/features/project-templates/schemas";
import type { ProjectTemplateSummary } from "@/types/project-template";

interface AuthorTemplateActionsProps {
  template: ProjectTemplateSummary;
  onDeleted?: () => void;
}

export function AuthorTemplateActions({ template, onDeleted }: AuthorTemplateActionsProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [hasPurchasesOpen, setHasPurchasesOpen] = React.useState(false);

  const updateMutation = useUpdateProjectTemplateListingMutation();
  const publishMutation = usePublishProjectTemplateMutation();
  const unpublishMutation = useUnpublishProjectTemplateMutation();
  const deleteMutation = useDeleteProjectTemplateMutation();

  const isRemoved = template.status === "REMOVED";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {!isRemoved ? (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil /> Editar anúncio
          </Button>
        ) : null}
        {template.status === "PUBLISHED" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={unpublishMutation.isPending}
            onClick={() => unpublishMutation.mutate(template.id)}
          >
            {unpublishMutation.isPending ? <Loader2 className="animate-spin" /> : <EyeOff />}
            Tirar do hub
          </Button>
        ) : null}
        {/* A template removed by moderation can't go back (API.md § 26.5). */}
        {template.status === "UNPUBLISHED" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={publishMutation.isPending}
            onClick={() => publishMutation.mutate(template.id)}
          >
            {publishMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            Devolver ao hub
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 /> Excluir
        </Button>
      </div>

      {editOpen ? (
        <TemplateListingDialog
          open
          onOpenChange={setEditOpen}
          title="Editar anúncio"
          description="A estrutura (colunas e campos) não muda aqui. Para atualizá-la, publique o projeto de novo e tire este modelo do hub. Um preço novo só vale para as próximas compras."
          submitLabel="Salvar"
          isPending={updateMutation.isPending}
          defaultValues={{
            name: template.name,
            description: template.description ?? "",
            category: template.category,
            isPaid: template.priceCents > 0,
            price: template.priceCents > 0 ? centsToReaisInput(template.priceCents) : "",
          }}
          onSubmit={(values) =>
            updateMutation.mutate(
              { templateId: template.id, input: toListingRequest(values, "edit") },
              { onSuccess: () => setEditOpen(false) }
            )
          }
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        trigger={<span className="hidden" />}
        title="Excluir este modelo?"
        description="Ele some do hub e da sua lista. Os projetos que já foram criados com ele continuam iguais."
        confirmLabel="Excluir modelo"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(template.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              onDeleted?.();
            },
            onError: (error) => {
              setDeleteOpen(false);
              if (getErrorCode(error) === "PROJECT_TEMPLATE_HAS_PURCHASES") {
                setHasPurchasesOpen(true);
              }
            },
          })
        }
      />

      <AlertDialog open={hasPurchasesOpen} onOpenChange={setHasPurchasesOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Este modelo não pode ser excluído</AlertDialogTitle>
            <AlertDialogDescription>
              Alguém já comprou este modelo, e quem comprou continua tendo direito a usá-lo.
              {template.status === "PUBLISHED"
                ? " Você pode tirá-lo do hub: ele deixa de aparecer para novas pessoas."
                : " Ele já está fora do hub, então ninguém novo consegue encontrá-lo."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            {template.status === "PUBLISHED" ? (
              <AlertDialogAction
                onClick={() => unpublishMutation.mutate(template.id)}
                disabled={unpublishMutation.isPending}
              >
                <EyeOff /> Tirar do hub
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
