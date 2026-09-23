"use client";

import { Lock, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAutomations } from "@/lib/permissions";
import { AutomationsSection } from "@/features/automations/components/automations-section";
import type { WorkspaceRole } from "@/types/workspace";

export default function AutomationsPage() {
  const { workspace, workspaceId, isLoading } = useCurrentWorkspace();
  const { userId } = useAuth();

  const myRole = workspace?.members.find((m) => m.userId === userId)?.role as
    | WorkspaceRole
    | undefined;
  const canManage = canManageAutomations(myRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        description="Regras “quando isso acontecer, faça aquilo” para este workspace."
      />

      {!isLoading && !workspaceId ? (
        <EmptyState
          icon={<Zap className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace para configurar automações aqui."
        />
      ) : workspaceId && !canManage ? (
        <EmptyState
          icon={<Lock className="size-6" />}
          title="Acesso restrito"
          description="Somente Proprietário e Administrador podem ver e gerenciar automações."
        />
      ) : workspaceId ? (
        <AutomationsSection key={workspaceId} workspaceId={workspaceId} />
      ) : null}
    </div>
  );
}
