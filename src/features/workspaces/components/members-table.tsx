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
import { isLastOwner } from "@/lib/permissions";
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
}: {
  workspace: Workspace;
  canManage: boolean;
}) {
  const { userId } = useAuth();
  const changeRoleMutation = useChangeMemberRoleMutation(workspace.id);
  const removeMemberMutation = useRemoveMemberMutation(workspace.id);

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
          const disableRoleChange = !canManage || protectedOwner;

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
                      {ROLE_OPTIONS.map((role) => (
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
