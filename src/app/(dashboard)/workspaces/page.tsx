"use client";

import * as React from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useWorkspacesQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { WorkspaceCard } from "@/features/workspaces/components/workspace-card";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";

export default function WorkspacesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const workspacesQuery = useWorkspacesQuery();
  const { workspaceId, setWorkspaceId } = useCurrentWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Workspaces dos quais você é membro."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Novo workspace
          </Button>
        }
      />

      {workspacesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : workspacesQuery.isError ? (
        <ErrorState error={workspacesQuery.error} onRetry={() => workspacesQuery.refetch()} />
      ) : workspacesQuery.data && workspacesQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspacesQuery.data.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              isCurrent={workspace.id === workspaceId}
              onSelect={() => setWorkspaceId(workspace.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="Nenhum workspace ainda"
          description="Crie o primeiro workspace para começar."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Criar workspace
            </Button>
          }
        />
      )}

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
