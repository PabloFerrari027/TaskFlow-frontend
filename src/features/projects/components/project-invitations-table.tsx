"use client";

import * as React from "react";
import { Ban, MailX } from "lucide-react";
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
import { InvitationStatusBadge } from "@/components/shared/status-badge";
import { Pager } from "@/components/shared/pager";
import { formatDate } from "@/lib/format";
import {
  useProjectInvitationsQuery,
  useRevokeProjectInvitationMutation,
} from "@/features/projects/hooks/use-projects";

export function ProjectInvitationsTable({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
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
        description="Convites enviados para este projeto aparecerão aqui."
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
              <TableCell>{invitation.role}</TableCell>
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
                        <Button variant="ghost" size="icon-sm">
                          <Ban className="text-destructive" />
                        </Button>
                      }
                      title="Revogar convite"
                      description={`O convite para ${invitation.email} deixará de ser válido.`}
                      confirmLabel="Revogar"
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
