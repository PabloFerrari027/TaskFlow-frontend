"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelConversationHistory } from "@/features/assistant-channels/components/channel-conversation-history";
import { ChannelLinkCard } from "@/features/assistant-channels/components/channel-link-card";
import { useAssistantChannelsQuery } from "@/features/assistant-channels/hooks/use-assistant-channels";
import { useWorkspacesQuery } from "@/features/workspaces/hooks/use-workspaces";

/**
 * The assistant outside the app (API.md § 28). Only channels the server has
 * configured (`available: true`) are shown; with none, the section is gone.
 */
export function AssistantChannelsSection({
  currentWorkspaceId,
}: {
  currentWorkspaceId: string | null;
}) {
  const channelsQuery = useAssistantChannelsQuery();
  const workspacesQuery = useWorkspacesQuery();
  const workspaces = React.useMemo(() => workspacesQuery.data ?? [], [workspacesQuery.data]);
  const workspaceNames = React.useMemo(
    () => new Map(workspaces.map((workspace) => [workspace.id, workspace.name])),
    [workspaces]
  );

  // A channel turned off on the server still shows while linked, so it can
  // be unlinked (that works with the channel off).
  const shown = (channelsQuery.data ?? []).filter((channel) => channel.available || channel.link);

  if (channelsQuery.isLoading) return <Skeleton className="h-40 w-full" />;
  // A failed load hides the section like an unavailable channel would.
  if (shown.length === 0) return null;

  return (
    <>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Assistente no WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Vincule seu número para falar com o assistente sem abrir o TaskFlow. Ações críticas,
            como excluir ou arquivar, só podem ser confirmadas aqui no app.
          </p>
        </div>
        {shown.map((channel) => (
          <ChannelLinkCard
            key={channel.channel}
            channel={channel}
            workspaces={workspaces}
            defaultWorkspaceId={currentWorkspaceId}
          />
        ))}
        <details className="rounded-lg border border-border/60 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            Comandos na conversa
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">ajuda</strong>: lista o que dá para fazer.
            </li>
            <li>
              <strong className="text-foreground">nova</strong>: o assistente esquece o contexto e
              recomeça. A conversa anterior continua no histórico.
            </li>
            <li>
              <strong className="text-foreground">sim</strong> / <strong className="text-foreground">não</strong>:
              confirmam ou cancelam a ação pendente quando só há uma aberta.
            </li>
            <li>
              <strong className="text-foreground">/desvincular</strong>: desvincula o número.
            </li>
            <li>
              Áudios são transcritos (o assistente repete o que entendeu). Fotos e documentos vão
              como anexo, com a legenda como mensagem.
            </li>
            <li>
              O assistente lembra da conversa por 24 horas desde a última mensagem. Depois disso,
              a próxima mensagem começa uma conversa nova.
            </li>
            <li>Ações pedidas no WhatsApp só podem ser confirmadas lá, e as do app só no app.</li>
          </ul>
        </details>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Conversas pelo WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Histórico completo, mesmo depois de “nova”, de trocar de workspace ou de desvincular.
          </p>
        </div>
        <ChannelConversationHistory workspaceNames={workspaceNames} />
      </section>
    </>
  );
}
