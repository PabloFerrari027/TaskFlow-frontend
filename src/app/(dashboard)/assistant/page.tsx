"use client";

import { Bot } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAssistantSettings } from "@/lib/permissions";
import { WorkspaceAssistantSettingsPanel } from "@/features/workspaces/components/assistant-settings-panel";
import type { WorkspaceRole } from "@/types/workspace";

export default function AssistantPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const { userId } = useAuth();

  const myRole = workspace?.members.find((m) => m.userId === userId)?.role as
    | WorkspaceRole
    | undefined;
  const canManage = canManageAssistantSettings(myRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistente"
        description="Liga ou desliga o assistente de IA com ações neste workspace."
      />

      {!isLoading && !workspace ? (
        <EmptyState
          icon={<Bot className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace para configurar o assistente aqui."
        />
      ) : workspace ? (
        <WorkspaceAssistantSettingsPanel workspace={workspace} canManage={canManage} />
      ) : null}
    </div>
  );
}
