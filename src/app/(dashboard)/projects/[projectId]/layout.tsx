"use client";

import * as React from "react";
import { use } from "react";
import { Archive, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { ProjectTabsNav } from "@/features/projects/components/project-tabs-nav";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { useArchiveProjectMutation, useProjectQuery } from "@/features/projects/hooks/use-projects";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";

export default function ProjectDetailLayout(
  props: LayoutProps<"/projects/[projectId]">
) {
  const { projectId } = use(props.params);
  const [editOpen, setEditOpen] = React.useState(false);

  const projectQuery = useProjectQuery(projectId);
  const { canManage } = useProjectPermission(projectId);
  const archiveMutation = useArchiveProjectMutation(projectId);

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
      <PageHeader
        title={project.name}
        description={project.description || "Sem descrição"}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <RoleGate allowed={canManage}>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil /> Editar
              </Button>
              {project.status === "ACTIVE" ? (
                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <Archive /> Arquivar
                    </Button>
                  }
                  title="Arquivar projeto"
                  description="O projeto será marcado como arquivado. Não é possível excluir projetos, apenas arquivá-los."
                  confirmLabel="Arquivar"
                  isLoading={archiveMutation.isPending}
                  onConfirm={() => archiveMutation.mutate()}
                />
              ) : null}
            </RoleGate>
          </div>
        }
      />

      {project.createdBy ? (
        <div className="-mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          Criado por <MemberAvatar userId={project.createdBy} className="size-5" />
          <MemberIdLabel userId={project.createdBy} />
        </div>
      ) : null}

      <ProjectTabsNav projectId={project.id} />

      {props.children}

      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
      <TaskDetailSheet projectId={project.id} />
    </div>
  );
}
