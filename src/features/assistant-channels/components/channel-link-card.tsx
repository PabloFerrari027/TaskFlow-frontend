"use client";

import * as React from "react";
import { AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useConfirmChannelVerificationMutation,
  useStartChannelVerificationMutation,
  useSwitchChannelWorkspaceMutation,
  useUnlinkChannelMutation,
} from "@/features/assistant-channels/hooks/use-assistant-channels";
import {
  channelLabel,
  formatPhone,
  whatsappChatUrl,
} from "@/features/assistant-channels/lib/channel-labels";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatRelativeTime, formatTime } from "@/lib/format";
import type { AssistantChannel, ChannelVerificationStarted } from "@/types/assistant-channel";
import type { Workspace } from "@/types/workspace";

function WorkspaceSelect({
  workspaces,
  value,
  onChange,
  disabled,
  id,
}: {
  workspaces: Workspace[];
  value: string;
  onChange: (workspaceId: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Workspace do assistente" className="w-full sm:w-64">
        <SelectValue placeholder="Escolha um workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            {workspace.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AssistantOffNote({ workspace }: { workspace: Workspace | undefined }) {
  if (!workspace || workspace.assistantEnabled) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      O assistente está desligado em “{workspace.name}”. Ele só responde depois que um
      Proprietário o ligar, acima.
    </p>
  );
}

/**
 * Two steps, both on this card: the number + workspace (TaskFlow sends a code
 * TO that number over the channel), then the code. Typing the code back here
 * is what proves the number is yours.
 */
function LinkForm({
  channel,
  workspaces,
  defaultWorkspaceId,
}: {
  channel: AssistantChannel;
  workspaces: Workspace[];
  defaultWorkspaceId: string | null;
}) {
  const [address, setAddress] = React.useState("");
  const [workspaceId, setWorkspaceId] = React.useState(defaultWorkspaceId ?? "");
  const [code, setCode] = React.useState("");
  const [sent, setSent] = React.useState<ChannelVerificationStarted | null>(null);

  const startMutation = useStartChannelVerificationMutation(channel.channel);
  const confirmMutation = useConfirmChannelVerificationMutation(channel.channel);
  const label = channelLabel(channel.channel);
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

  function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    confirmMutation.reset();
    startMutation.mutate(
      { address: address.trim(), workspaceId },
      {
        onSuccess: (result) => {
          setSent(result);
          setCode("");
        },
      }
    );
  }

  if (sent) {
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          confirmMutation.mutate(code);
        }}
      >
        <p className="text-sm text-foreground">
          Enviamos um código para <strong>{formatPhone(sent.address)}</strong> no {label}. Ele vale
          até {formatTime(sent.expiresAt)}.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor={`${channel.channel}-code`}>Código de 6 dígitos</Label>
          <Input
            id={`${channel.channel}-code`}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-40 font-mono tracking-widest"
          />
        </div>
        {confirmMutation.error ? (
          <p className="text-sm text-destructive">{getErrorMessage(confirmMutation.error)}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={code.length !== 6 || confirmMutation.isPending} loading={confirmMutation.isPending}>
            Confirmar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={startMutation.isPending}
            onClick={() => sendCode()}
          >
            Enviar outro código
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSent(null);
              confirmMutation.reset();
            }}
          >
            Trocar número
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-3" onSubmit={sendCode}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${channel.channel}-address`}>Seu número no {label}</Label>
          <Input
            id={`${channel.channel}-address`}
            type="tel"
            autoComplete="tel"
            placeholder="+55 11 99999-8888"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Com DDD. Fora do Brasil, inclua o código do país.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${channel.channel}-workspace`}>Workspace</Label>
          <WorkspaceSelect
            id={`${channel.channel}-workspace`}
            workspaces={workspaces}
            value={workspaceId}
            onChange={setWorkspaceId}
          />
          <p className="text-xs text-muted-foreground">Onde o assistente vai trabalhar.</p>
        </div>
      </div>
      <AssistantOffNote workspace={selectedWorkspace} />
      {startMutation.error ? (
        <p className="text-sm text-destructive">{getErrorMessage(startMutation.error)}</p>
      ) : null}
      <Button
        type="submit"
        disabled={address.trim().length < 3 || !workspaceId || startMutation.isPending}
        loading={startMutation.isPending}
      >
        Enviar código pelo {label}
      </Button>
    </form>
  );
}

function LinkedState({
  channel,
  workspaces,
}: {
  channel: AssistantChannel & { link: NonNullable<AssistantChannel["link"]> };
  workspaces: Workspace[];
}) {
  const { link } = channel;
  const [pendingWorkspaceId, setPendingWorkspaceId] = React.useState<string | null>(null);
  const switchMutation = useSwitchChannelWorkspaceMutation(channel.channel);
  const unlinkMutation = useUnlinkChannelMutation(channel.channel);
  const label = channelLabel(channel.channel);
  const workspace = workspaces.find((item) => item.id === link.workspaceId);
  const pendingWorkspace = workspaces.find((item) => item.id === pendingWorkspaceId);

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-0.5">
          <dt className="text-xs text-muted-foreground">Número vinculado</dt>
          <dd className="font-medium text-foreground">{formatPhone(link.externalId)}</dd>
          <dd className="text-xs text-muted-foreground">
            Desde {formatDateTime(link.linkedAt)}
            {link.lastMessageAt
              ? ` · última mensagem ${formatRelativeTime(link.lastMessageAt)}`
              : " · nenhuma mensagem ainda"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Workspace do assistente</dt>
          <dd>
            <WorkspaceSelect
              workspaces={workspaces}
              value={link.workspaceId}
              disabled={switchMutation.isPending}
              onChange={(workspaceId) => {
                if (workspaceId !== link.workspaceId) setPendingWorkspaceId(workspaceId);
              }}
            />
          </dd>
          {!workspace ? (
            <dd className="text-xs text-destructive">
              Você não tem mais acesso a este workspace. Escolha outro.
            </dd>
          ) : null}
        </div>
      </dl>
      <AssistantOffNote workspace={workspace} />

      {!link.lastMessageAt && channel.contact ? (
        <p className="text-sm text-muted-foreground">
          Mande um “oi” para {formatPhone(channel.contact)} para começar. O TaskFlow não consegue
          iniciar a conversa sozinho.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {channel.contact ? (
          <Button asChild variant="outline">
            <a href={whatsappChatUrl(channel.contact, "oi")} target="_blank" rel="noreferrer">
              <MessageCircle /> Abrir conversa <ExternalLink className="size-3 opacity-60" />
            </a>
          </Button>
        ) : null}
        <ConfirmDialog
          trigger={
            <Button variant="ghost" className="text-destructive">
              Desvincular
            </Button>
          }
          title={`Desvincular o ${label}?`}
          description="O assistente para de responder neste número. As conversas continuam no histórico."
          confirmLabel="Desvincular"
          isLoading={unlinkMutation.isPending}
          onConfirm={() => unlinkMutation.mutate()}
        />
      </div>

      <ConfirmDialog
        trigger={<span hidden />}
        open={pendingWorkspaceId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingWorkspaceId(null);
        }}
        variant="default"
        title={`Trocar para “${pendingWorkspace?.name ?? "outro workspace"}”?`}
        description="O assistente esquece a conversa atual e recomeça do zero. Ela continua no histórico."
        confirmLabel="Trocar"
        isLoading={switchMutation.isPending}
        onConfirm={() => {
          if (!pendingWorkspaceId) return;
          switchMutation.mutate(pendingWorkspaceId, {
            onSettled: () => setPendingWorkspaceId(null),
          });
        }}
      />
    </div>
  );
}

export function ChannelLinkCard({
  channel,
  workspaces,
  defaultWorkspaceId,
}: {
  channel: AssistantChannel;
  workspaces: Workspace[];
  defaultWorkspaceId: string | null;
}) {
  const label = channelLabel(channel.channel);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <MessageCircle className="size-5" />
        </span>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground">
            Converse com o assistente pelo {label}: mande texto, áudio, foto ou documento. Toda
            alteração pede confirmação com os botões Confirmar e Cancelar.
          </p>
        </div>
      </div>

      {channel.link ? (
        <LinkedState channel={{ ...channel, link: channel.link }} workspaces={workspaces} />
      ) : (
        <LinkForm
          channel={channel}
          workspaces={workspaces}
          defaultWorkspaceId={defaultWorkspaceId}
        />
      )}
    </Card>
  );
}
