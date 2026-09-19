"use client";

import { Switch } from "@/components/ui/switch";
import { useUpdateAssistantSettingsMutation } from "@/features/workspaces/hooks/use-workspaces";
import type { Workspace } from "@/types/workspace";

// OWNER-only (API.md § 4/16) — deliberately more restrictive than the
// ADMIN-level actions elsewhere on this page. Off by default for every
// workspace; the backend can also turn this off on its own (kill switch on
// repeated prompt-injection signals or reauth failures) and only an OWNER
// can turn it back on here.
export function WorkspaceAssistantSettingsPanel({
  workspace,
  canManage,
}: {
  workspace: Workspace;
  canManage: boolean;
}) {
  const updateMutation = useUpdateAssistantSettingsMutation(workspace.id);

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Assistente de IA com ações</p>
          <p className="text-xs text-muted-foreground">
            Permite conversar com um assistente que pode ler dados deste workspace e propor
            ações (criar tarefas, arquivar projetos, etc.) — toda ação de escrita exige sua
            confirmação explícita antes de acontecer.
          </p>
        </div>
        <Switch
          checked={workspace.assistantEnabled}
          disabled={!canManage || updateMutation.isPending}
          onCheckedChange={(checked) => updateMutation.mutate(checked)}
        />
      </div>

      {!canManage ? (
        <p className="text-xs text-muted-foreground">
          Somente o OWNER do workspace pode ligar ou desligar o assistente.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Se o assistente detectar repetidos sinais de conteúdo suspeito ou tentativas de senha
          incorreta ao confirmar uma ação, ele se desliga sozinho por segurança — reative aqui
          quando quiser.
        </p>
      )}
    </div>
  );
}
