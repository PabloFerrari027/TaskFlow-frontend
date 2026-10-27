"use client";

import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAssistantSettings } from "@/lib/permissions";
import { WorkspaceAssistantSettingsPanel } from "@/features/workspaces/components/assistant-settings-panel";
import { AssistantPromptCard } from "@/features/assistant/components/assistant-prompt-card";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";
import { FoldedSection } from "@/components/shared/folded-section";
import { AssistantAllowanceCard } from "@/features/plans/components/assistant-allowance-card";
import { AssistantProfileCard } from "@/features/assistant/components/assistant-profile-card";
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
        description="Converse com a IA, ajuste como ela funciona e acompanhe quanto você já usou."
      />

      {workspace?.assistantEnabled ? <AssistantPromptCard /> : null}

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">O que o assistente sabe sobre você</h2>
          <p className="text-sm text-muted-foreground">
            Um resumo que ele mesmo escreve com o que você conta, para ajudar melhor — vale no app e no
            WhatsApp. Você pode corrigir ou apagar quando quiser.
          </p>
        </div>
        <AssistantProfileCard />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Liga ou desliga o assistente de IA com ações neste espaço.
          </p>
        </div>
        {!isLoading && !workspace ? (
          <EmptyState
            icon={<Bot className="size-6" />}
            title="Você ainda não tem um espaço"
            description="Crie um espaço para configurar o assistente aqui."
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
          <h2 className="text-lg font-medium text-foreground">Quanto ainda dá para conversar</h2>
        </div>
        <AssistantAllowanceCard showPlanLink />
        <FoldedSection title="Ver detalhes técnicos" hint="O histórico do consumo em tokens, a unidade que a IA cobra">
          <AiUsageHistory />
        </FoldedSection>
      </section>
    </div>
  );
}
