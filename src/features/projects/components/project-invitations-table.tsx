"use client";

import * as React from "react";
import { Ban, MailX, UserPlus } from "lucide-react";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvitationStatusBadge, PROJECT_ROLE_LABEL } from "@/components/shared/status-badge";
import { Pager } from "@/components/shared/pager";
import { formatDate } from "@/lib/format";
import {
  useProjectInvitationsQuery,
  useRevokeProjectInvitationMutation,
} from "@/features/projects/hooks/use-projects";

export function ProjectInvitationsTable({
  projectId,
  canManage,
  onInvite,
}: {
  projectId: string;
  canManage: boolean;
  // Lets the empty state offer the invite action directly.
  onInvite?: () => void;
}) {
  const [page, setPage] = React.useState(1);
  const invitationsQuery = useProjectInvitationsQuery(projectId, page);
  const revokeMutation = useRevokeProjectInvitationMutation(projectId);

  if (invitationsQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (invitationsQuery.isError) {
    return (
      <ErrorState error={invitationsQuery.error} onRetry={() => invitationsQuery.refetch()} />
    );
  }

  const invitations = invitationsQuery.data?.data ?? [];

  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={<MailX className="size-6" />}
        title="Nenhum convite enviado"
        description="Quando você convidar alguém por e-mail, o convite aparecerá aqui e você poderá ver se já foi aceito."
        action={
          onInvite && canManage ? (
            <Button onClick={onInvite}>
              <UserPlus /> Convidar pessoa
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expira</TableHead>
            {canManage ? <TableHead className="w-10" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>{PROJECT_ROLE_LABEL[invitation.role] ?? invitation.role}</TableCell>
              <TableCell>
                <InvitationStatusBadge status={invitation.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(invitation.expiresAt)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  {invitation.status === "PENDING" ? (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label="Cancelar convite" title="Cancelar convite">
                          <Ban className="text-destructive" />
                        </Button>
                      }
                      title="Cancelar convite?"
                      description={`O convite enviado para ${invitation.email} deixará de funcionar.`}
                      confirmLabel="Cancelar convite"
                      isLoading={revokeMutation.isPending}
                      onConfirm={() => revokeMutation.mutate(invitation.id)}
                    />
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {invitationsQuery.data ? (
        <Pager
          meta={invitationsQuery.data.meta}
          onPageChange={setPage}
          isLoading={invitationsQuery.isFetching}
        />
      ) : null}
    </div>
  );
}
