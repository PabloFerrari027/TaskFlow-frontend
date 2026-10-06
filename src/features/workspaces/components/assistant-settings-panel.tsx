"use client";

import { Switch } from "@/components/ui/switch";
import { useUpdateAssistantSettingsMutation } from "@/features/workspaces/hooks/use-workspaces";
import type { Workspace } from "@/types/workspace";

// OWNER-only (API.md § 4/16) — deliberately more restrictive than the
// ADMIN-level actions elsewhere on this page. Off by default for every
// workspace; the backend can also turn this off on its own (kill switch on
// repeated prompt-injection signals or reauth failures) and only an OWNER
// can turn it back on here.
// Renders flat (no border of its own) so it sits inside the caller's Card.
export function WorkspaceAssistantSettingsPanel({
  workspace,
  canManage,
}: {
  workspace: Workspace;
  canManage: boolean;
}) {
  const updateMutation = useUpdateAssistantSettingsMutation(workspace.id);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Assistente de IA</h3>
          <p className="text-sm text-muted-foreground">
            Converse com um assistente que lê os dados deste workspace e sugere ações, como
            criar itens. Nada é alterado sem a sua confirmação.
          </p>
        </div>
        <Switch
          aria-label="Ligar ou desligar o assistente de IA"
          checked={workspace.assistantEnabled}
          disabled={!canManage || updateMutation.isPending}
          onCheckedChange={(checked) => updateMutation.mutate(checked)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {canManage
          ? "Por segurança, ele se desliga sozinho se notar conteúdo suspeito ou senhas erradas repetidas. Religue aqui quando quiser."
          : "Somente o dono do workspace pode ligar ou desligar o assistente."}
      </p>
    </div>
  );
}
