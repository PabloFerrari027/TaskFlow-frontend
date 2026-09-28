"use client";

import * as React from "react";
import Link from "next/link";
import { FolderKanban, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageWorkspace } from "@/lib/permissions";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import { ProjectTree } from "@/features/projects/components/project-tree";
import { ProjectTable } from "@/features/projects/components/project-table";
import { ProjectViewToggle } from "@/features/projects/components/project-view-toggle";
import { ProjectGridSkeleton } from "@/features/projects/components/project-grid-skeleton";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import {
  useProjectViewMode,
  type ProjectViewMode,
} from "@/features/projects/hooks/use-project-view-mode";
import type { Project } from "@/types/project";

function ProjectList({
  viewMode,
  ...props
}: {
  viewMode: ProjectViewMode;
  projects: Project[];
  allProjects: Project[];
  workspaceId: string;
  canManage: boolean;
}) {
  return viewMode === "table" ? <ProjectTable {...props} /> : <ProjectTree {...props} />;
}

export default function ProjectsPage() {
  const { workspace, workspaceId, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { userId } = useAuth();
  const { viewMode, setViewMode } = useProjectViewMode();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const projectsQuery = useProjectsQuery(workspaceId);

  const projects = projectsQuery.data?.data ?? [];
  const canManage = canManageWorkspace(
    workspace?.members.find((member) => member.userId === userId)?.role
  );
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const archivedProjects = projects.filter((p) => p.status === "ARCHIVED");
  const isTruncated = (projectsQuery.data?.meta.totalPages ?? 0) > 1;

  if (!workspaceLoading && !workspace) {
    return (
      <>
        <PageHeader title="Projetos" />
        <EmptyState
          className="mt-6"
          icon={<FolderKanban className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace para começar a organizar projetos e tarefas."
          action={
            <Button onClick={() => setCreateWorkspaceOpen(true)}>
              <Plus /> Criar workspace
            </Button>
          }
        />
        <CreateWorkspaceDialog
          open={createWorkspaceOpen}
          onOpenChange={setCreateWorkspaceOpen}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description={
          workspace
            ? `Todos os projetos de ${workspace.name}.`
            : "Todos os projetos deste workspace."
        }
        actions={
          workspaceId ? (
            <>
              <Button asChild variant="outline">
                <Link href="/templates">
                  <LayoutTemplate /> Começar de um modelo
                </Link>
              </Button>
              <Button data-tour="new-project" onClick={() => setCreateOpen(true)}>
                <Plus /> Novo projeto
              </Button>
            </>
          ) : null
        }
      />

      {workspaceLoading || projectsQuery.isLoading ? (
        <ProjectGridSkeleton />
      ) : projectsQuery.isError ? (
        <ErrorState error={projectsQuery.error} onRetry={() => projectsQuery.refetch()} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-6" />}
          title="Nenhum projeto neste workspace"
          description="Crie o primeiro projeto do zero ou comece de um modelo já organizado."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Novo projeto
              </Button>
              <Button asChild variant="outline">
                <Link href="/templates">
                  <LayoutTemplate /> Começar de um modelo
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
        {isTruncated ? (
          <p className="text-xs text-muted-foreground">
            Mostrando os primeiros {projectsQuery.data?.meta.limit} de{" "}
            {projectsQuery.data?.meta.total} projetos.
          </p>
        ) : null}
        <Tabs defaultValue="active">
          <div
            data-tour="project-list-controls"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <TabsList>
              <TabsTrigger value="active">Ativos ({activeProjects.length})</TabsTrigger>
              <TabsTrigger value="archived">
                Arquivados ({archivedProjects.length})
              </TabsTrigger>
            </TabsList>
            <ProjectViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          <TabsContent value="active" className="pt-4">
            {activeProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="Nenhum projeto ativo"
              />
            ) : (
              <ProjectList
                projects={activeProjects}
                allProjects={projects}
                workspaceId={workspaceId as string}
                canManage={canManage}
                viewMode={viewMode}
              />
            )}
          </TabsContent>

          <TabsContent value="archived" className="pt-4">
            {archivedProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="Nenhum projeto arquivado"
              />
            ) : (
              <ProjectList
                projects={archivedProjects}
                allProjects={projects}
                workspaceId={workspaceId as string}
                canManage={canManage}
                viewMode={viewMode}
              />
            )}
          </TabsContent>
        </Tabs>
        </>
      )}

      {workspaceId ? (
        <CreateProjectDialog
          workspaceId={workspaceId}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      ) : null}
    </div>
  );
}
