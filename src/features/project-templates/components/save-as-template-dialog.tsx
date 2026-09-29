"use client";

import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import { useSaveProjectAsTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import { toListingRequest } from "@/features/project-templates/schemas";
import type { Project } from "@/types/project";

// Mirrors API.md § 26.6: only the structure goes, frozen at save time.
function WhatGoesNotice() {
  return (
    <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm sm:grid-cols-2">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Vai para o modelo</p>
        <ul className="space-y-1 text-muted-foreground">
          {["As colunas (com as subcolunas)", "Os campos extras"].map((item) => (
            <li key={item} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Não vai</p>
        <ul className="space-y-1 text-muted-foreground">
          {["Tarefas e comentários", "Anexos", "Pessoas do projeto"].map((item) => (
            <li key={item} className="flex items-start gap-1.5">
              <X className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        O modelo é uma cópia congelada: mudar o projeto depois não muda o modelo. Para atualizar,
        salve de novo.
      </p>
    </div>
  );
}

export function SaveAsTemplateDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const saveMutation = useSaveProjectAsTemplateMutation(project.id);

  return (
    <TemplateListingDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Salvar como modelo"
      description="Crie projetos novos com a mesma organização deste. O modelo fica disponível só para as pessoas deste workspace."
      notice={<WhatGoesNotice />}
      submitLabel="Salvar modelo"
      isPending={saveMutation.isPending}
      defaultValues={{
        name: project.name,
        description: project.description ?? "",
        // No category: there is no sensible default, the user picks one.
      }}
      onSubmit={(values) => {
        const request = toListingRequest(values, "save");
        saveMutation.mutate(
          { ...request, description: request.description ?? undefined },
          {
            onSuccess: (template) => {
              onOpenChange(false);
              toast.success("Modelo salvo.", {
                action: {
                  label: "Ver modelo",
                  onClick: () => router.push(`/templates/${template.id}`),
                },
              });
            },
          }
        );
      }}
    />
  );
}
