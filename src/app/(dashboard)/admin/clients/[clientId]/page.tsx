"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { useClientAiUsageQuery, useClientQuery } from "@/features/admin/hooks/use-clients";
import { AssignClientPlanCard } from "@/features/plans/components/assign-client-plan-card";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";
import type { AiUsageFeature } from "@/types/ai-usage";

export default function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientQuery = useClientQuery(clientId);

  // `GET /admin/clients/:id` is itself SUPER_ADMIN-only — this page is only
  // linked to from behind ClientsTable's own gate, but a non-admin could
  // still type the URL directly, so it gets the same 403 -> redirect as
  // ClientsTable/PlansTable.
  React.useEffect(() => {
    if (
      clientQuery.isError &&
      axios.isAxiosError(clientQuery.error) &&
      clientQuery.error.response?.status === 403
    ) {
      router.replace("/403");
    }
  }, [clientQuery.isError, clientQuery.error, router]);

  // Named so react-hooks/rules-of-hooks treats it as a hook: it forwards to
  // useClientAiUsageQuery, closing over this page's clientId, so AiUsageHistory
  // can stay ignorant of which endpoint (self or admin) it's talking to.
  function useUsageQuery(params: { days: number; feature?: AiUsageFeature; page: number }) {
    return useClientAiUsageQuery(clientId, params);
  }

  if (clientQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (clientQuery.isError || !clientQuery.data) {
    return <ErrorState error={clientQuery.error} onRetry={() => clientQuery.refetch()} />;
  }

  const client = clientQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader title={client.email} description={`Cliente desde ${formatDate(client.createdAt)}`} />

      <Card className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoField label="Status" value={<ClientStatusBadge status={client.status} />} />
        <InfoField label="Papel" value={client.role} />
        <InfoField label="Workspaces próprios" value={String(client.ownedWorkspacesCount)} />
        <InfoField label="Sessões ativas" value={String(client.activeSessionsCount)} />
        <InfoField label="Google vinculado" value={client.googleLinked ? "Sim" : "Não"} />
      </Card>

      <AssignClientPlanCard clientId={client.id} />

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Uso de IA</h2>
        <AiUsageHistory useUsageQuery={useUsageQuery} />
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
