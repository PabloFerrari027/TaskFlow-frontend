"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import {
  DEFAULT_SNAPSHOT_OPTIONS,
  SnapshotOptionsFields,
  toSnapshotRequest,
  type SnapshotOptionsValue,
} from "@/features/project-templates/components/snapshot-options-fields";
import { useSaveProjectAsTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import { toListingRequest } from "@/features/project-templates/schemas";
import type { Project } from "@/types/project";

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
  const [include, setInclude] = React.useState<SnapshotOptionsValue>(DEFAULT_SNAPSHOT_OPTIONS);

  return (
    <TemplateListingDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Salvar como modelo"
      description="Crie projetos novos com a mesma organização deste. O modelo fica disponível só para as pessoas deste workspace."
      notice={
        <SnapshotOptionsFields
          workspaceId={project.workspaceId}
          value={include}
          onChange={setInclude}
        />
      }
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
          {
            name: request.name,
            category: request.category,
            description: request.description ?? undefined,
            ...toSnapshotRequest(include),
          },
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
