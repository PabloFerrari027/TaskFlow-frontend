"use client";

import * as React from "react";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectGridSkeleton } from "@/features/projects/components/project-grid-skeleton";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";

export default function DashboardPage() {
  const { workspace, workspaceId, isLoading: workspaceLoading } =
    useCurrentWorkspace();
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);

  const projectsQuery = useProjectsQuery(workspaceId);
  const activeProjects = (projectsQuery.data ?? []).filter(
    (p) => p.status === "ACTIVE"
  );

  if (!workspaceLoading && !workspace) {
    return (
      <>
        <PageHeader title="Dashboard" />
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
        title={workspace ? workspace.name : "Dashboard"}
        description="Visão geral dos projetos ativos deste workspace."
        actions={
          workspaceId ? (
            <Button onClick={() => setCreateProjectOpen(true)}>
              <Plus /> Novo projeto
            </Button>
          ) : null
        }
      />

      {projectsQuery.isLoading ? (
        <ProjectGridSkeleton />
      ) : projectsQuery.isError ? (
        <ErrorState error={projectsQuery.error} onRetry={() => projectsQuery.refetch()} />
      ) : activeProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-6" />}
          title="Nenhum projeto ativo"
          description="Crie o primeiro projeto deste workspace para começar a organizar tarefas."
          action={
            <Button onClick={() => setCreateProjectOpen(true)}>
              <Plus /> Novo projeto
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {activeProjects.length > 0 ? (
        <div className="text-sm text-muted-foreground">
          <Link href="/projects" className="font-medium text-primary hover:underline">
            Ver todos os projetos
          </Link>{" "}
          (incluindo arquivados)
        </div>
      ) : null}

      {workspaceId ? (
        <CreateProjectDialog
          workspaceId={workspaceId}
          open={createProjectOpen}
          onOpenChange={setCreateProjectOpen}
        />
      ) : null}
    </div>
  );
}
