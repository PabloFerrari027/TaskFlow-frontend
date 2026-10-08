"use client";

import Link from "next/link";
import { UserMinus, UserPlus, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FOLDER_ROLE_LABEL } from "@/components/shared/status-badge";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatDate } from "@/lib/format";
import {
  useFolderMembersQuery,
  useRemoveFolderMemberMutation,
} from "@/features/folders/hooks/use-folders";

export function FolderMembersTable({
  folderId,
  canManage,
}: {
  folderId: string;
  canManage: boolean;
}) {
  const membersQuery = useFolderMembersQuery(folderId);
  const removeMutation = useRemoveFolderMemberMutation(folderId);

  if (membersQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (membersQuery.isError) {
    return <ErrorState error={membersQuery.error} onRetry={() => membersQuery.refetch()} />;
  }

  if (!membersQuery.data || membersQuery.data.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-6" />}
        title="Ninguém foi adicionado só a esta pasta"
        description="Quem já faz parte do workspace tem acesso automaticamente. Para dar acesso a outra pessoa, envie um convite."
        action={
          canManage ? (
            <Button asChild>
              <Link href={`/folders/${folderId}/invitations`}>
                <UserPlus /> Convidar pessoa
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

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
        {membersQuery.data.map((member) => (
          <TableRow key={member.userId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <MemberAvatar userId={member.userId} name={member.name} />
                <MemberIdLabel userId={member.userId} name={member.name} />
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{FOLDER_ROLE_LABEL[member.role] ?? member.role}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(member.createdAt)}
            </TableCell>
            {canManage ? (
              <TableCell>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label="Remover da pasta" title="Remover da pasta">
                      <UserMinus className="text-destructive" />
                    </Button>
                  }
                  title="Remover da pasta?"
                  description="Esta pessoa perderá o acesso a esta pasta. Você pode convidá-la de novo quando quiser."
                  confirmLabel="Remover"
                  isLoading={removeMutation.isPending}
                  onConfirm={() => removeMutation.mutate(member.userId)}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
