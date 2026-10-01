"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import { useSaveProjectAsTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import { toListingRequest } from "@/features/project-templates/schemas";
import type { Project } from "@/types/project";

interface IncludeOptions {
  includeTasks: boolean;
  includeAutomations: boolean;
  includeRecurrences: boolean;
}

const OPTIONS: { key: keyof IncludeOptions; label: string; hint: string }[] = [
  {
    key: "includeTasks",
    label: "As tarefas",
    hint: "Com subtarefas, prioridade e campos extras. Prazos viram “X dias depois de criar”. Responsáveis, comentários e anexos não vão.",
  },
  {
    key: "includeRecurrences",
    label: "As tarefas repetidas",
    hint: "As que estão ligadas, sem o responsável. O fuso é escolhido de novo ao usar o modelo.",
  },
  {
    key: "includeAutomations",
    label: "As automações deste projeto",
    hint: "As regras que agem só neste projeto e não dependem de pessoas específicas.",
  },
];

// Mirrors API.md § 26.6: the structure always goes; the rest is opt-in.
function WhatGoesNotice({
  value,
  onChange,
}: {
  value: IncludeOptions;
  onChange: (value: IncludeOptions) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
      <p className="flex items-start gap-1.5 text-muted-foreground">
        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
        Sempre vão as colunas (com as subcolunas), os campos extras e as etapas.
      </p>
      <div className="space-y-2">
        <p className="font-medium text-foreground">Levar também</p>
        {OPTIONS.map((option) => (
          <label key={option.key} className="flex items-start gap-2">
            <Checkbox
              className="mt-0.5"
              checked={value[option.key]}
              onCheckedChange={(checked) => onChange({ ...value, [option.key]: checked === true })}
            />
            <span>
              <span className="block text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <X className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
        Nunca vão comentários, anexos nem as pessoas do projeto. O modelo é uma cópia congelada:
        mudar o projeto depois não muda o modelo.
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
  const [include, setInclude] = React.useState<IncludeOptions>({
    includeTasks: true,
    includeAutomations: true,
    includeRecurrences: true,
  });

  return (
    <TemplateListingDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Salvar como modelo"
      description="Crie projetos novos com a mesma organização deste. O modelo fica disponível só para as pessoas deste workspace."
      notice={<WhatGoesNotice value={include} onChange={setInclude} />}
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
          { ...request, description: request.description ?? undefined, ...include },
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
