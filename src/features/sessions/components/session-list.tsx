"use client";

import { MonitorSmartphone, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatRelativeTime } from "@/lib/format";
import { describeDevice } from "@/features/sessions/lib/describe-device";
import {
  useRevokeSessionMutation,
  useSessionsQuery,
} from "@/features/sessions/hooks/use-sessions";

export function SessionList() {
  const sessionsQuery = useSessionsQuery();
  const revokeMutation = useRevokeSessionMutation();

  if (sessionsQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return <ErrorState error={sessionsQuery.error} onRetry={() => sessionsQuery.refetch()} />;
  }

  const sessions = sessionsQuery.data?.data ?? [];

  if (sessions.length === 0) {
    return (
      <EmptyState icon={<MonitorSmartphone className="size-6" />} title="Nenhum aparelho conectado" />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id} className="flex-row items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <MonitorSmartphone className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {describeDevice(session.deviceInfo)}
                </p>
                {session.current ? <Badge>Este aparelho</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Usado {formatRelativeTime(session.lastUsedAt)}
              </p>
            </div>
          </div>

          {!session.current ? (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm">
                  <ShieldOff /> Desconectar
                </Button>
              }
              title="Desconectar este aparelho?"
              description={`${describeDevice(session.deviceInfo)} sai da sua conta agora e vai precisar entrar de novo.`}
              confirmLabel="Desconectar"
              isLoading={revokeMutation.isPending}
              onConfirm={() => revokeMutation.mutate(session.id)}
            />
          ) : null}
        </Card>
      ))}
    </div>
  );
}
