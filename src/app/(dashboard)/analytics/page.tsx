"use client";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";

export default function AnalyticsPage() {
  const { workspaceId, isLoading } = useCurrentWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análises"
        description="Um resumo visual das tarefas deste workspace."
      />

      {!isLoading && !workspaceId ? (
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace com projetos e tarefas para ver os gráficos aqui."
        />
      ) : workspaceId ? (
        <AnalyticsDashboard key={workspaceId} workspaceId={workspaceId} />
      ) : null}
    </div>
  );
}
