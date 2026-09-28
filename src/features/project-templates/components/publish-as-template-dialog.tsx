"use client";

import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import { usePublishProjectAsTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import { toListingRequest } from "@/features/project-templates/schemas";
import type { Project } from "@/types/project";

// Mirrors API.md § 26.4: only the structure goes, frozen at publish time.
function WhatGoesNotice() {
  return (
    <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm sm:grid-cols-2">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Vai para o hub</p>
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
        publique de novo.
      </p>
    </div>
  );
}

export function PublishAsTemplateDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const publishMutation = usePublishProjectAsTemplateMutation(project.id);

  return (
    <TemplateListingDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Publicar como modelo"
      description="Outras pessoas vão poder criar projetos com a mesma organização deste."
      notice={<WhatGoesNotice />}
      submitLabel="Publicar no hub"
      isPending={publishMutation.isPending}
      defaultValues={{
        name: project.name,
        description: project.description ?? "",
        // No category: there is no sensible default, the author picks one.
        isPaid: false,
        price: "",
      }}
      onSubmit={(values) => {
        const request = toListingRequest(values, "publish");
        publishMutation.mutate(
          { ...request, description: request.description ?? undefined },
          {
            onSuccess: (template) => {
              onOpenChange(false);
              toast.success("Modelo publicado no hub.", {
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
