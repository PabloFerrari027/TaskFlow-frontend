"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, History, SearchX, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAuth } from "@/lib/auth/auth-context";
import { getErrorCode } from "@/lib/errors";
import { canInstantiateFolderTemplate } from "@/lib/permissions";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { getCategoryInfo } from "@/features/folder-templates/lib/categories";
import {
  TEMPLATE_LANGUAGE_LABEL,
  TEMPLATE_LEVEL_LABEL,
  formatTemplateCounts,
  getAuthorLabel,
  isWorkspaceTemplate,
  plural,
} from "@/features/folder-templates/lib/template-labels";
import { TemplateAiDialog } from "@/features/folder-templates/components/template-ai-dialog";
import { TemplateImage } from "@/features/folder-templates/components/template-image";
import { TemplateMediaManager } from "@/features/folder-templates/components/template-media-manager";
import {
  PublishVersionDialog,
  TemplateVersionsCard,
} from "@/features/folder-templates/components/template-versions";
import { WorkspaceTemplateBadge } from "@/features/folder-templates/components/template-badges";
import { TemplatePrimaryAction } from "@/features/folder-templates/components/template-primary-action";
import { TemplateStructurePreview } from "@/features/folder-templates/components/template-structure-preview";
import { WorkspaceTemplateActions } from "@/features/folder-templates/components/workspace-template-actions";
import {
  useFolderTemplateCategoriesQuery,
  useFolderTemplateQuery,
} from "@/features/folder-templates/hooks/use-folder-templates";

function BackToTemplates({ applyTo }: { applyTo?: string }) {
  return (
    <Link
      href={applyTo ? `/templates?applyTo=${encodeURIComponent(applyTo)}` : "/templates"}
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
  const categoriesQuery = useFolderTemplateCategoriesQuery();
  const detailQuery = useFolderTemplateQuery(templateId);
  const [aiOpen, setAiOpen] = React.useState(false);
  const applyTo = useSearchParams().get("applyTo") ?? undefined;
  const [publishOpen, setPublishOpen] = React.useState(false);

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
    if (getErrorCode(detailQuery.error) === "FOLDER_TEMPLATE_NOT_FOUND") {
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
  const canManage = isWorkspace && canInstantiateFolderTemplate(myRole);
  // Adapting takes OWNER/ADMIN of the current workspace, and a template it
  // may use: a system one, or one of this workspace.
  const currentRole = workspace?.members.find((member) => member.userId === userId)?.role;
  const canAdapt =
    Boolean(workspace) &&
    canInstantiateFolderTemplate(currentRole) &&
    (!template.workspaceId || template.workspaceId === workspace?.id);
  const meta = [
    template.level ? TEMPLATE_LEVEL_LABEL[template.level] : null,
    template.language && template.language !== "pt-BR" ? TEMPLATE_LANGUAGE_LABEL[template.language] : null,
    template.estimatedDurationDays ? `cerca de ${plural(template.estimatedDurationDays, "dia", "dias")}` : null,
    template.stats?.instantiationCount ? plural(template.stats.instantiationCount, "uso", "usos") : null,
    template.version > 1 ? `versão ${template.version}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <BackToTemplates applyTo={applyTo} />

      <Card className={template.hasCover ? "pt-0" : undefined}>
        {template.hasCover ? (
          <TemplateImage template={template} image="cover" alt="" className="aspect-[16/5] w-full" />
        ) : null}
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
            {meta.length > 0 ? ` · ${meta.join(" · ")}` : ""}
          </p>
          {template.tags?.length ? (
            <div className="flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          {template.description ? (
            <CardDescription className="whitespace-pre-line text-foreground/80">
              {template.description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {template.screenshotCount > 0 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Imagens do modelo">
              {Array.from({ length: template.screenshotCount }).map((_, index) => (
                <li key={index} className="shrink-0">
                  <TemplateImage
                    template={template}
                    image={index}
                    alt={`Imagem ${index + 1} do modelo`}
                    className="aspect-video w-64 rounded-md border border-border/60"
                  />
                </li>
              ))}
            </ul>
          ) : null}
          <TemplatePrimaryAction template={template} applyToFolderId={applyTo} />
          {canAdapt ? (
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              <Sparkles /> Adaptar com IA
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar este modelo</CardTitle>
            <CardDescription>
              Para mudar a estrutura, publique uma versão nova: ela é lida de novo da pasta de
              origem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <WorkspaceTemplateActions template={template} onDeleted={() => router.push("/templates")} />
              <Button variant="outline" size="sm" onClick={() => setPublishOpen(true)}>
                <History /> Publicar versão nova
              </Button>
            </div>
            <TemplateMediaManager template={template} />
          </CardContent>
        </Card>
      ) : null}

      <TemplateStructurePreview skeleton={template.skeleton} />

      <TemplateVersionsCard templateId={template.id} />

      {aiOpen && workspace ? (
        <TemplateAiDialog
          mode={{ kind: "adapt", templateId: template.id, templateName: template.name }}
          workspace={workspace}
          open
          onOpenChange={setAiOpen}
        />
      ) : null}
      {publishOpen && workspace ? (
        <PublishVersionDialog
          template={template}
          workspaceId={workspace.id}
          open
          onOpenChange={setPublishOpen}
        />
      ) : null}
    </div>
  );
}
