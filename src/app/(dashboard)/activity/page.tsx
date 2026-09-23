"use client";

import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { WorkspaceActivitySection } from "@/features/activity/components/workspace-activity-section";

export default function ActivityPage() {
  const { workspaceId, isLoading } = useCurrentWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atividade"
        description="A linha do tempo de tudo que aconteceu neste workspace."
      />

      {!isLoading && !workspaceId ? (
        <EmptyState
          icon={<History className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace para começar a ver o histórico de atividade aqui."
        />
      ) : workspaceId ? (
        <WorkspaceActivitySection key={workspaceId} workspaceId={workspaceId} />
      ) : null}
    </div>
  );
}
