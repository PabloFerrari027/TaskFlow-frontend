"use client";

import * as React from "react";
import { FolderKanban, Plus } from "lucide-react";
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
import { ProjectGridSkeleton } from "@/features/projects/components/project-grid-skeleton";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";

export default function ProjectsPage() {
  const { workspace, workspaceId, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { userId } = useAuth();
  const [createOpen, setCreateOpen] = React.useState(false);
  const projectsQuery = useProjectsQuery(workspaceId);

  const projects = projectsQuery.data?.data ?? [];
  const canManage = canManageWorkspace(
    workspace?.members.find((member) => member.userId === userId)?.role
  );
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const archivedProjects = projects.filter((p) => p.status === "ARCHIVED");
  const isTruncated = (projectsQuery.data?.meta.totalPages ?? 0) > 1;

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
        <>
        {isTruncated ? (
          <p className="text-xs text-muted-foreground">
            Mostrando os primeiros {projectsQuery.data?.meta.limit} de{" "}
            {projectsQuery.data?.meta.total} projetos.
          </p>
        ) : null}
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
              <ProjectTree
                projects={activeProjects}
                allProjects={projects}
                workspaceId={workspaceId as string}
                canManage={canManage}
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
              <ProjectTree
                projects={archivedProjects}
                allProjects={projects}
                workspaceId={workspaceId as string}
                canManage={canManage}
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
