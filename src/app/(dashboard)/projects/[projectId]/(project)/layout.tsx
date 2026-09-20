"use client";

import * as React from "react";
import { use } from "react";
import { Archive, FolderInput, FolderPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { ProjectTabsNav } from "@/features/projects/components/project-tabs-nav";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { MoveProjectDialog } from "@/features/projects/components/move-project-dialog";
import { ProjectBreadcrumb } from "@/features/projects/components/project-breadcrumb";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import {
  useArchiveProjectMutation,
  useProjectQuery,
  useProjectsQuery,
} from "@/features/projects/hooks/use-projects";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";
import { useAuth } from "@/lib/auth/auth-context";

export default function ProjectDetailLayout(
  props: LayoutProps<"/projects/[projectId]">
) {
  const { projectId } = use(props.params);
  const [editOpen, setEditOpen] = React.useState(false);
  const [subprojectOpen, setSubprojectOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const { userId } = useAuth();
  const projectQuery = useProjectQuery(projectId);
  const { canManage } = useProjectPermission(projectId);
  const archiveMutation = useArchiveProjectMutation(projectId);
  // Destination list for "Mover para…" — same cached query as the projects page.
  const workspaceProjectsQuery = useProjectsQuery(projectQuery.data?.workspaceId ?? null);

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <ErrorState error={projectQuery.error} onRetry={() => projectQuery.refetch()} />;
  }

  const project = projectQuery.data;

  return (
    <div className="space-y-6">
      <ProjectBreadcrumb project={project} />

      <PageHeader
        title={project.name}
        description={project.description || "Sem descrição"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <RoleGate allowed={canManage}>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil /> Editar nome e descrição
              </Button>
              {project.status === "ACTIVE" ? (
                <Button variant="outline" size="sm" onClick={() => setSubprojectOpen(true)}>
                  <FolderPlus /> Criar sub-projeto
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
                <FolderInput /> Mover para outro projeto
              </Button>
              {project.status === "ACTIVE" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setArchiveOpen(true)}
                >
                  <Archive /> Arquivar projeto
                </Button>
              ) : null}
            </RoleGate>
          </div>
        }
      />

      {project.status === "ARCHIVED" ? (
        <div className="-mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Archive className="size-4 shrink-0" aria-hidden />
          Este projeto está arquivado: ele fica guardado apenas para consulta.
        </div>
      ) : null}

      {project.createdBy === userId ? (
        <p className="-mt-4 text-xs text-muted-foreground">Criado por você</p>
      ) : null}

      <ProjectTabsNav projectId={project.id} />

      {props.children}

      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
      <CreateProjectDialog
        workspaceId={project.workspaceId}
        parent={project}
        open={subprojectOpen}
        onOpenChange={setSubprojectOpen}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        trigger={<span className="hidden" />}
        title="Arquivar este projeto?"
        description="O projeto fica guardado apenas para consulta. Projetos não podem ser excluídos, somente arquivados."
        confirmLabel="Arquivar projeto"
        isLoading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />
      {moveOpen ? (
        <MoveProjectDialog
          project={project}
          projects={workspaceProjectsQuery.data?.data ?? []}
          open
          onOpenChange={setMoveOpen}
        />
      ) : null}
      <TaskDetailSheet projectId={project.id} />
    </div>
  );
}
