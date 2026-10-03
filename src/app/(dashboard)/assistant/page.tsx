"use client";

import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAssistantSettings } from "@/lib/permissions";
import { WorkspaceAssistantSettingsPanel } from "@/features/workspaces/components/assistant-settings-panel";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";
import { AssistantChannelsSection } from "@/features/assistant-channels/components/assistant-channels-section";
import type { WorkspaceRole } from "@/types/workspace";

export default function AssistantPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const { userId } = useAuth();

  const myRole = workspace?.members.find((m) => m.userId === userId)?.role as
    | WorkspaceRole
    | undefined;
  const canManage = canManageAssistantSettings(myRole);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assistente"
        description="Configure o assistente de IA e acompanhe quanto você já usou."
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Liga ou desliga o assistente de IA com ações neste workspace.
          </p>
        </div>
        {!isLoading && !workspace ? (
          <EmptyState
            icon={<Bot className="size-6" />}
            title="Você ainda não tem um workspace"
            description="Crie um workspace para configurar o assistente aqui."
          />
        ) : workspace ? (
          <Card className="p-4">
            <WorkspaceAssistantSettingsPanel workspace={workspace} canManage={canManage} />
          </Card>
        ) : null}
      </section>

      <AssistantChannelsSection currentWorkspaceId={workspace?.id ?? null} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Uso de IA</h2>
          <p className="text-sm text-muted-foreground">
            Histórico do consumo de tokens do assistente e das análises com IA na sua conta.
          </p>
        </div>
        <AiUsageHistory />
      </section>
    </div>
  );
}
