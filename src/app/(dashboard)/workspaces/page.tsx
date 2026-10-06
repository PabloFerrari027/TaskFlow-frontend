"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, PanelsTopLeft, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useDeleteWorkspaceMutation,
  useWorkspaceQuery,
  useWorkspacesQuery,
} from "@/features/workspaces/hooks/use-workspaces";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { WorkspaceCard } from "@/features/workspaces/components/workspace-card";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import { MembersTable } from "@/features/workspaces/components/members-table";
import { WorkspaceInvitationsTable } from "@/features/workspaces/components/invitations-table";
import { InviteMemberDialog } from "@/features/workspaces/components/invite-member-dialog";
import { RenameWorkspaceDialog } from "@/features/workspaces/components/rename-workspace-dialog";
import { WorkspaceAssistantSettingsPanel } from "@/features/workspaces/components/assistant-settings-panel";
import { WorkspaceActivitySection } from "@/features/activity/components/workspace-activity-section";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canDeleteWorkspace,
  canInviteWorkspaceMembers,
  canManageAssistantSettings,
  canManageWorkspace,
} from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";

// One page for everything workspace-related: the cards pick the current
// workspace (same as the topbar switcher) and the sections below always show
// the settings of whichever one is current.
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
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : workspacesQuery.isError ? (
        <ErrorState error={workspacesQuery.error} onRetry={() => workspacesQuery.refetch()} />
      ) : workspacesQuery.data && workspacesQuery.data.length > 0 ? (
        <>
          <div data-tour="workspace-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspacesQuery.data.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                isCurrent={workspace.id === workspaceId}
                onSelect={() => setWorkspaceId(workspace.id)}
              />
            ))}
          </div>

          {workspaceId ? <CurrentWorkspaceSettings key={workspaceId} workspaceId={workspaceId} /> : null}
        </>
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

function CurrentWorkspaceSettings({ workspaceId }: { workspaceId: string }) {
  const { userId } = useAuth();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const deleteMutation = useDeleteWorkspaceMutation(workspaceId);

  if (workspaceQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState error={workspaceQuery.error} onRetry={() => workspaceQuery.refetch()} />;
  }

  const workspace = workspaceQuery.data;
  const myRole = workspace.members.find((m) => m.userId === userId)?.role as
    | WorkspaceRole
    | undefined;
  const canManage = canManageWorkspace(myRole);
  const canInvite = canInviteWorkspaceMembers(myRole);
  const canDelete = canDeleteWorkspace(myRole);
  const isEmpty = workspace.members.length === 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{workspace.name}</h2>
          <p className="text-sm text-muted-foreground">
            Configurações do workspace atual · {workspace.members.length} membro(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/workspaces/${workspace.id}/pages`}>
              <PanelsTopLeft /> Páginas
            </Link>
          </Button>
          <RoleGate allowed={canManage}>
            <Button variant="outline" onClick={() => setRenameOpen(true)}>
              <Pencil /> Renomear
            </Button>
          </RoleGate>
          <RoleGate allowed={canDelete}>
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={!isEmpty}
                  title={
                    isEmpty
                      ? undefined
                      : "Remova os demais membros antes de excluir o workspace."
                  }
                >
                  <Trash2 /> Excluir
                </Button>
              }
              title="Excluir workspace"
              description="Esta ação é irreversível e não pode ser desfeita pela plataforma. O workspace deixará de aparecer para todos os membros."
              confirmLabel="Excluir"
              isLoading={deleteMutation.isPending}
              // The current-workspace context falls back to another workspace
              // once the list refetches without this one.
              onConfirm={() => deleteMutation.mutate()}
            />
          </RoleGate>
        </div>
      </div>

      <Card data-tour="workspace-members-section" className="space-y-4 p-4">
        <h3 className="text-base font-semibold text-foreground">Membros</h3>
        <MembersTable workspace={workspace} canManage={canManage} currentUserRole={myRole} />
      </Card>

      <Card data-tour="workspace-invitations-section" className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Convites</h3>
          <RoleGate allowed={canInvite}>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus /> Convidar
            </Button>
          </RoleGate>
        </div>
        <WorkspaceInvitationsTable workspaceId={workspace.id} canManage={canInvite} />
      </Card>

      <Card id="assistente" data-tour="workspace-assistant-section" className="p-4">
        <WorkspaceAssistantSettingsPanel
          workspace={workspace}
          canManage={canManageAssistantSettings(myRole)}
        />
      </Card>

      <Card id="atividade" data-tour="workspace-activity-section" className="space-y-4 p-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Atividade</h3>
          <p className="text-sm text-muted-foreground">
            A linha do tempo de tudo que aconteceu neste workspace. Para ver só uma pasta, abra a
            aba Atividade dentro dele.
          </p>
        </div>
        <WorkspaceActivitySection workspaceId={workspace.id} />
      </Card>

      <RenameWorkspaceDialog
        workspaceId={workspace.id}
        currentName={workspace.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <InviteMemberDialog
        workspaceId={workspace.id}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
