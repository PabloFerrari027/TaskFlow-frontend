"use client";

import { Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { TemplateCard } from "@/features/project-templates/components/template-card";
import {
  TemplateGrid,
  TemplateGridSkeleton,
} from "@/features/project-templates/components/template-gallery";
import {
  useProjectTemplateCategoriesQuery,
  useWorkspaceProjectTemplatesQuery,
} from "@/features/project-templates/hooks/use-project-templates";

// The current workspace's private templates (API.md § 26.7) — saved from its
// own projects, seen only by its members.
export function WorkspaceTemplatesSection() {
  const { workspace } = useCurrentWorkspace();
  const templatesQuery = useWorkspaceProjectTemplatesQuery(workspace?.id);
  const categoriesQuery = useProjectTemplateCategoriesQuery();

  if (!workspace) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelos de {workspace.name}</CardTitle>
        <CardDescription>
          Modelos salvos a partir dos projetos deste workspace. Só as pessoas daqui veem e usam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templatesQuery.isLoading ? (
          <TemplateGridSkeleton count={3} />
        ) : templatesQuery.isError ? (
          <ErrorState error={templatesQuery.error} onRetry={() => templatesQuery.refetch()} />
        ) : !templatesQuery.data?.length ? (
          <EmptyState
            icon={<Package className="size-6" />}
            title="Nenhum modelo salvo ainda"
            description="Abra um projeto e use “Salvar como modelo” para reaproveitar a organização dele em projetos novos."
          />
        ) : (
          <TemplateGrid>
            {templatesQuery.data.map((template) => (
              <TemplateCard key={template.id} template={template} categories={categoriesQuery.data} />
            ))}
          </TemplateGrid>
        )}
      </CardContent>
    </Card>
  );
}
