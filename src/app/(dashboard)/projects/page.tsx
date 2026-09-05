"use client";

import * as React from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectGridSkeleton } from "@/features/projects/components/project-grid-skeleton";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";

export default function ProjectsPage() {
  const { workspaceId, isLoading: workspaceLoading } = useCurrentWorkspace();
  const [createOpen, setCreateOpen] = React.useState(false);
  const projectsQuery = useProjectsQuery(workspaceId);

  const projects = projectsQuery.data ?? [];
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const archivedProjects = projects.filter((p) => p.status === "ARCHIVED");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Todos os projetos deste workspace."
        actions={
          workspaceId ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Novo projeto
            </Button>
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
          description="Crie o primeiro projeto para começar a organizar tarefas."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Novo projeto
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Ativos ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="archived">
              Arquivados ({archivedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="pt-4">
            {activeProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="Nenhum projeto ativo"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="pt-4">
            {archivedProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="Nenhum projeto arquivado"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archivedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
