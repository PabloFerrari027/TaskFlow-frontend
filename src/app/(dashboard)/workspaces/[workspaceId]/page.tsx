"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useDeleteWorkspaceMutation,
  useWorkspaceQuery,
} from "@/features/workspaces/hooks/use-workspaces";
import { MembersTable } from "@/features/workspaces/components/members-table";
import { WorkspaceInvitationsTable } from "@/features/workspaces/components/invitations-table";
import { WorkspaceActivitySection } from "@/features/activity/components/workspace-activity-section";
import { InviteMemberDialog } from "@/features/workspaces/components/invite-member-dialog";
import { RenameWorkspaceDialog } from "@/features/workspaces/components/rename-workspace-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canDeleteWorkspace,
  canInviteWorkspaceMembers,
  canManageWorkspace,
} from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
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
      <PageHeader
        title={workspace.name}
        description={`${workspace.members.length} membro(s)`}
        actions={
          <>
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
                onConfirm={() =>
                  deleteMutation.mutate(undefined, {
                    onSuccess: () => router.push("/workspaces"),
                  })
                }
              />
            </RoleGate>
          </>
        }
      />

      <Card className="p-0">
        <Tabs defaultValue="members">
          <div className="flex items-center justify-between border-b border-border/60 px-4 pt-2">
            <TabsList>
              <TabsTrigger value="members">Membros</TabsTrigger>
              <TabsTrigger value="invitations">Convites</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="members" className="p-4">
            <MembersTable workspace={workspace} canManage={canManage} />
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4 p-4">
            <RoleGate allowed={canInvite}>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus /> Convidar
                </Button>
              </div>
            </RoleGate>
            <WorkspaceInvitationsTable workspaceId={workspace.id} canManage={canInvite} />
          </TabsContent>

          <TabsContent value="activity" className="p-4">
            <WorkspaceActivitySection workspaceId={workspace.id} />
          </TabsContent>
        </Tabs>
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
