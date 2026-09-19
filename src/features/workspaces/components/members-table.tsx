"use client";

import { UserMinus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatDate } from "@/lib/format";
import { canGrantOwnerRole, isLastOwner } from "@/lib/permissions";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useChangeMemberRoleMutation,
  useRemoveMemberMutation,
} from "@/features/workspaces/hooks/use-workspaces";
import type { Workspace, WorkspaceRole } from "@/types/workspace";

const ROLE_OPTIONS: WorkspaceRole[] = ["OWNER", "ADMIN", "MEMBER", "GUEST"];

export function MembersTable({
  workspace,
  canManage,
  currentUserRole,
}: {
  workspace: Workspace;
  canManage: boolean;
  currentUserRole: WorkspaceRole | null | undefined;
}) {
  const { userId } = useAuth();
  const changeRoleMutation = useChangeMemberRoleMutation(workspace.id);
  const removeMemberMutation = useRemoveMemberMutation(workspace.id);
  const canGrantOwner = canGrantOwnerRole(currentUserRole);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Membro</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Desde</TableHead>
          {canManage ? <TableHead className="w-10" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {workspace.members.map((member) => {
          const protectedOwner = isLastOwner(workspace.members, member.userId);
          // Granting OWNER, and demoting an existing OWNER, both require the
          // acting user to already be an OWNER — an ADMIN can't touch OWNER
          // at all, in either direction.
          const ownerRoleLocked = member.role === "OWNER" && !canGrantOwner;
          const disableRoleChange = !canManage || protectedOwner || ownerRoleLocked;
          // Keep OWNER out of the option list unless the acting user can
          // grant it — except on the row it's already selected for, so the
          // trigger still displays the member's real (locked) role.
          const roleOptions = canGrantOwner
            ? ROLE_OPTIONS
            : ROLE_OPTIONS.filter((role) => role !== "OWNER" || role === member.role);

          return (
            <TableRow key={member.userId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MemberAvatar userId={member.userId} />
                  <MemberIdLabel userId={member.userId} />
                </div>
              </TableCell>
              <TableCell>
                {canManage ? (
                  <Select
                    value={member.role}
                    disabled={disableRoleChange || changeRoleMutation.isPending}
                    onValueChange={(role) =>
                      changeRoleMutation.mutate({
                        memberId: member.userId,
                        payload: { role: role as WorkspaceRole },
                      })
                    }
                  >
                    <SelectTrigger size="sm" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  member.role
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(member.createdAt)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={protectedOwner || member.userId === userId}
                      >
                        <UserMinus className="text-destructive" />
                      </Button>
                    }
                    title="Remover membro"
                    description="Esta pessoa perderá acesso a este workspace. Essa ação não pode ser desfeita."
                    confirmLabel="Remover"
                    isLoading={removeMemberMutation.isPending}
                    onConfirm={() => removeMemberMutation.mutate(member.userId)}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
