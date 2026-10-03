"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { canInstantiateProjectTemplate } from "@/lib/permissions";
import { TemplateAiDialog } from "@/features/project-templates/components/template-ai-dialog";
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
  const { userId } = useAuth();
  const [aiOpen, setAiOpen] = React.useState(false);
  const applyTo = useSearchParams().get("applyTo") ?? undefined;

  if (!workspace) return null;
  // The AI and saving templates take OWNER/ADMIN (API.md § 26.7).
  const canUseAi = canInstantiateProjectTemplate(
    workspace.members.find((member) => member.userId === userId)?.role
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelos de {workspace.name}</CardTitle>
        <CardDescription>
          Modelos salvos a partir dos projetos deste workspace. Só as pessoas daqui veem e usam.
        </CardDescription>
        {canUseAi ? (
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              <Sparkles /> Criar com IA
            </Button>
          </CardAction>
        ) : null}
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
            description={
              canUseAi
                ? "Abra um projeto e use “Salvar como modelo”, ou descreva o que você precisa em “Criar com IA”."
                : "Abra um projeto e use “Salvar como modelo” para reaproveitar a organização dele em projetos novos."
            }
          />
        ) : (
          <TemplateGrid>
            {templatesQuery.data.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                categories={categoriesQuery.data}
                applyTo={applyTo}
              />
            ))}
          </TemplateGrid>
        )}
      </CardContent>
      {aiOpen ? (
        <TemplateAiDialog
          mode={{ kind: "generate" }}
          workspace={workspace}
          open
          onOpenChange={setAiOpen}
        />
      ) : null}
    </Card>
  );
}
