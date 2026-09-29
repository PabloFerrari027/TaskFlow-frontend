"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAuth } from "@/lib/auth/auth-context";
import { getErrorCode } from "@/lib/errors";
import { canInstantiateProjectTemplate } from "@/lib/permissions";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import {
  formatTemplateCounts,
  getAuthorLabel,
  isWorkspaceTemplate,
} from "@/features/project-templates/lib/template-labels";
import { WorkspaceTemplateBadge } from "@/features/project-templates/components/template-badges";
import { TemplatePrimaryAction } from "@/features/project-templates/components/template-primary-action";
import { TemplateStructurePreview } from "@/features/project-templates/components/template-structure-preview";
import { WorkspaceTemplateActions } from "@/features/project-templates/components/workspace-template-actions";
import {
  useProjectTemplateCategoriesQuery,
  useProjectTemplateQuery,
} from "@/features/project-templates/hooks/use-project-templates";

function BackToTemplates() {
  return (
    <Link
      href="/templates"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Modelos
    </Link>
  );
}

export function TemplateDetailView({ templateId }: { templateId: string }) {
  const router = useRouter();
  const { workspace } = useCurrentWorkspace();
  const { userId } = useAuth();
  const categoriesQuery = useProjectTemplateCategoriesQuery();
  const detailQuery = useProjectTemplateQuery(templateId);

  const template = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!template) {
    if (getErrorCode(detailQuery.error) === "PROJECT_TEMPLATE_NOT_FOUND") {
      return (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="Este modelo não está mais disponível"
          description="Ele pode ter sido excluído, ou pertence a um workspace do qual você não faz parte."
          action={
            <Button asChild variant="outline">
              <Link href="/templates">Voltar para os modelos</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />;
  }

  const category = getCategoryInfo(template.category, categoriesQuery.data);
  const isWorkspace = isWorkspaceTemplate(template);
  // Editing and deleting a workspace template takes OWNER/ADMIN of that
  // workspace (API.md § 26.7) — the same role that saves and uses templates.
  const myRole =
    workspace && workspace.id === template.workspaceId
      ? workspace.members.find((member) => member.userId === userId)?.role
      : undefined;
  const canManage = isWorkspace && canInstantiateProjectTemplate(myRole);

  return (
    <div className="space-y-6">
      <BackToTemplates />

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span aria-hidden>{category.icon}</span> {category.label}
            </span>
            {isWorkspace ? <WorkspaceTemplateBadge /> : null}
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">{template.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {getAuthorLabel(template)} · {formatTemplateCounts(template)}
          </p>
          {template.description ? (
            <CardDescription className="whitespace-pre-line text-foreground/80">
              {template.description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <TemplatePrimaryAction template={template} />
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar este modelo</CardTitle>
            <CardDescription>
              A estrutura não muda: para atualizá-la, salve o projeto como modelo de novo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceTemplateActions template={template} onDeleted={() => router.push("/templates")} />
          </CardContent>
        </Card>
      ) : null}

      <TemplateStructurePreview skeleton={template.skeleton} />
    </div>
  );
}
