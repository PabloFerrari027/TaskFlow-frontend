"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TemplateListingDialog } from "@/features/folder-templates/components/template-listing-dialog";
import {
  DEFAULT_SNAPSHOT_OPTIONS,
  SnapshotOptionsFields,
  toSnapshotRequest,
  type SnapshotOptionsValue,
} from "@/features/folder-templates/components/snapshot-options-fields";
import { useSaveFolderAsTemplateMutation } from "@/features/folder-templates/hooks/use-folder-templates";
import { toListingRequest } from "@/features/folder-templates/schemas";
import type { Folder } from "@/types/folder";

export function SaveAsTemplateDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const saveMutation = useSaveFolderAsTemplateMutation(folder.id);
  const [include, setInclude] = React.useState<SnapshotOptionsValue>(DEFAULT_SNAPSHOT_OPTIONS);

  return (
    <TemplateListingDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Salvar como modelo"
      description="Crie pastas novas com a mesma organização desta. O modelo fica disponível só para as pessoas deste workspace."
      notice={
        <SnapshotOptionsFields
          workspaceId={folder.workspaceId}
          value={include}
          onChange={setInclude}
        />
      }
      submitLabel="Salvar modelo"
      isPending={saveMutation.isPending}
      defaultValues={{
        name: folder.name,
        description: folder.description ?? "",
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
