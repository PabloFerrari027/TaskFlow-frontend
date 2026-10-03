"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import {
  useDeleteProjectTemplateMutation,
  useUpdateProjectTemplateMutation,
} from "@/features/project-templates/hooks/use-project-templates";
import { toListingRequest } from "@/features/project-templates/schemas";
import type { ProjectTemplateSummary } from "@/types/project-template";

interface WorkspaceTemplateActionsProps {
  template: ProjectTemplateSummary;
  onDeleted?: () => void;
}

export function WorkspaceTemplateActions({ template, onDeleted }: WorkspaceTemplateActionsProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const updateMutation = useUpdateProjectTemplateMutation();
  const deleteMutation = useDeleteProjectTemplateMutation();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil /> Editar modelo
        </Button>
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
          title="Editar modelo"
          description="Muda como o modelo aparece. A estrutura só muda com uma versão nova."
          submitLabel="Salvar"
          isPending={updateMutation.isPending}
          withDetails
          defaultValues={{
            name: template.name,
            description: template.description ?? "",
            category: template.category,
            tags: (template.tags ?? []).join(", "),
            level: template.level ?? "",
            language: template.language ?? "pt-BR",
            estimatedDurationDays: template.estimatedDurationDays
              ? String(template.estimatedDurationDays)
              : "",
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
        description="Ele some para todo o workspace. Os projetos que já foram criados com ele continuam iguais."
        confirmLabel="Excluir modelo"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(template.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              onDeleted?.();
            },
            onError: () => setDeleteOpen(false),
          })
        }
      />
    </>
  );
}
