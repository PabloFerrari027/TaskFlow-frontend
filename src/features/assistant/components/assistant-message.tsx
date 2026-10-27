"use client";

import * as React from "react";
import { CheckCheck, CircleAlert, CircleCheck, History, Loader2, Mic, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { getErrorCode } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useConfirmPendingActionMutation } from "@/features/assistant/hooks/use-assistant";
import { PendingActionCard } from "@/features/assistant/components/pending-action-card";
import { TypingIndicator } from "@/features/assistant/components/typing-indicator";
import { formatAudioDuration } from "@/features/assistant/lib/attachment-limits";
import { toolLabel } from "@/features/assistant/lib/tool-labels";
import type {
  AssistantChatStage,
  AssistantChatStatus,
  ChatTranscriptMessage,
  PendingActionLocalStatus,
} from "@/features/assistant/types";

// The API only reports *which* stage the assistant is in — the wording is
// ours, kept plain for non-technical users.
// What became of a card proposed in an earlier visit.
const PAST_ACTION_STATUS: Record<"pending" | "confirmed" | "cancelled" | "expired", string> = {
  pending: "Ainda dá para confirmar.",
  confirmed: "Confirmada.",
  cancelled: "Cancelada.",
  expired: "Não foi confirmada a tempo. Se ainda quiser, peça de novo.",
};

const STAGE_LABEL: Record<Exclude<AssistantChatStage, "running_tool">, string> = {
  transcribing: "Ouvindo seu áudio...",
  reading_attachments: "Lendo os anexos...",
  loading_context: "Olhando o seu espaço...",
  thinking: "Pensando...",
  checking_content: "Revisando a resposta...",
};

// Tools that run right away: reads, plus the capture tools that write without
// a confirmation. Any other tool registers an action for the user to confirm,
// so it gets the generic "preparing" label.
const READ_TOOL_LABEL: Record<string, string> = {
  list_items: "Consultando os itens...",
  list_folders: "Consultando as pastas...",
  list_workspaces: "Consultando os espaços...",
  list_sessions: "Consultando suas sessões...",
  find_information: "Procurando nas suas anotações...",
  suggest_organization: "Vendo como organizar suas anotações...",
  save_information: "Guardando a informação...",
  undo_saved_information: "Desfazendo...",
  // Runs right away only when the destination already exists.
  relocate_information: "Vendo para onde levar...",
};

function streamingStatusLabel(status: AssistantChatStatus): string {
  if (status.stage !== "running_tool") return STAGE_LABEL[status.stage];
  return (status.tool && READ_TOOL_LABEL[status.tool]) || "Preparando a ação para você confirmar...";
}

// The user bubble uses `bg-primary`, so `MarkdownContent`'s default
// `text-foreground` (meant for a plain/muted background) would lose
// contrast — override text, links, and the code/quote backgrounds it
// renders internally to read against `primary` instead.
const USER_BUBBLE_MARKDOWN_CLASS = cn(
  "text-primary-foreground",
  "[&_a]:text-primary-foreground [&_a]:underline",
  "[&_pre]:bg-primary-foreground/10 [&_code]:bg-primary-foreground/10",
  "[&_blockquote]:border-primary-foreground/30",
  "[&_hr]:border-primary-foreground/30",
  "[&_th]:border-primary-foreground/30 [&_th]:bg-primary-foreground/10 [&_td]:border-primary-foreground/30"
);

export function AssistantMessage({
  message,
  workspaceId,
  onPendingActionStatusChange,
  onRetry,
}: {
  message: ChatTranscriptMessage;
  workspaceId: string;
  onPendingActionStatusChange: (actionId: string, status: PendingActionLocalStatus) => void;
  // Only on a user bubble that never got an answer (`message.failed`).
  onRetry?: () => void;
}) {
  const isUser = message.role === "user";
  const isStreaming = message.streamingStatus !== undefined;
  // Voice notes are labelled inside the bubble (their transcription is the
  // bubble's text); only other files are listed as chips below it.
  const voiceNotes = message.attachments?.filter((attachment) => attachment.isAudio) ?? [];
  const fileAttachments = message.attachments?.filter((attachment) => !attachment.isAudio) ?? [];
  // "Confirmar tudo": the person's own click, confirming the standard cards of
  // this reply one by one (a critical one keeps its own click + reauth).
  const confirmMutation = useConfirmPendingActionMutation(workspaceId);
  const [confirmingAll, setConfirmingAll] = React.useState(false);
  const confirmable =
    message.pendingActions?.filter((action) => action.status === "pending" && action.riskLevel !== "critical") ?? [];
  const confirmableCount = confirmable.length;

  async function confirmAll() {
    setConfirmingAll(true);
    for (const action of confirmable) {
      try {
        await confirmMutation.mutateAsync({ actionId: action.id, tool: action.tool, isCurrentSession: action.isCurrentSession });
        onPendingActionStatusChange(action.id, "confirmed");
      } catch (error) {
        const code = getErrorCode(error);
        if (code === "PENDING_ACTION_EXPIRED" || code === "PENDING_ACTION_NOT_FOUND") {
          onPendingActionStatusChange(action.id, "expired");
        }
      }
    }
    setConfirmingAll(false);
  }

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {isUser ? null : (
        <span
          aria-hidden
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground"
        >
          <Sparkles className="size-3.5" />
        </span>
      )}
      <div className={cn("min-w-0 space-y-2", isUser ? "max-w-[85%]" : "flex-1")}>
        {isStreaming && !message.content ? (
          <TypingIndicator />
        ) : message.content || voiceNotes.length > 0 || !isUser ? (
          <div
            className={cn(
              "px-3.5 py-2.5",
              isUser
                ? "rounded-2xl rounded-br-md bg-primary"
                : "rounded-2xl rounded-tl-md bg-muted/70"
            )}
          >
            {voiceNotes.map((voiceNote, index) => (
              <p
                key={index}
                className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary-foreground/75"
              >
                <Mic className="size-3.5" />
                Mensagem de voz
                {voiceNote.durationSeconds !== undefined ? (
                  <span className="tabular-nums">
                    · {formatAudioDuration(voiceNote.durationSeconds)}
                  </span>
                ) : null}
              </p>
            ))}
            {message.content ? (
              <MarkdownContent
                content={message.content}
                className={isUser ? USER_BUBBLE_MARKDOWN_CLASS : undefined}
              />
            ) : message.transcribing ? (
              <p className="animate-pulse text-sm text-primary-foreground/80">
                Transcrevendo seu áudio...
              </p>
            ) : voiceNotes.length > 0 ? (
              <p className="text-sm text-primary-foreground/80 italic">Áudio não transcrito.</p>
            ) : null}
          </div>
        ) : null}

        {isUser && message.failed ? (
          <p className="flex items-center justify-end gap-1.5 text-xs text-destructive">
            <CircleAlert className="size-3.5" />
            Não enviada
            {onRetry ? (
              <>
                {" — "}
                <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">
                  tentar de novo
                </button>
              </>
            ) : null}
          </p>
        ) : null}

        {isStreaming && message.streamingStatus ? (
          <p
            aria-live="polite"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Loader2 className="size-3 animate-spin" />
            {streamingStatusLabel(message.streamingStatus)}
          </p>
        ) : null}

        {fileAttachments.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {fileAttachments.map((attachment, index) => (
              <span
                key={index}
                className="flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                <Paperclip className="size-3" />
                <span className="max-w-35 truncate">{attachment.fileName}</span>
              </span>
            ))}
          </div>
        ) : null}

        {/* Reads and the capture tools (which run without a confirmation)
            land here. Transparency requirement (API.md § 16): a concluded
            action is shown, never just implied by the reply text. */}
        {message.executedActions && message.executedActions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {message.executedActions.map((action, index) => (
              <span
                key={index}
                className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-foreground"
              >
                <CircleCheck className="size-3 text-success" />
                {toolLabel(action.tool)}
              </span>
            ))}
          </div>
        ) : null}

        {/* From a resumed conversation: the action can no longer be confirmed
            here (it expired), and whether it was is not saved — say so plainly. */}
        {message.pastActions && message.pastActions.length > 0 ? (
          <ul className="space-y-1.5">
            {message.pastActions.map((action, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground"
              >
                <History className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Ação proposta:</span>{" "}
                  {action.humanDescription ?? toolLabel(action.tool)}
                  {action.status ? (
                    <span className="block">{PAST_ACTION_STATUS[action.status]}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {message.pendingActions?.map((pendingAction) => (
          <PendingActionCard
            key={pendingAction.id}
            pendingAction={pendingAction}
            workspaceId={workspaceId}
            busy={confirmingAll}
            onStatusChange={(status) => onPendingActionStatusChange(pendingAction.id, status)}
          />
        ))}

        {/* Several cards in one reply (e.g. three bills) — one tap for all of
            them. Still the person's own click; critical ones keep their own. */}
        {confirmableCount >= 2 ? (
          <Button size="sm" onClick={confirmAll} loading={confirmingAll} disabled={confirmingAll}>
            <CheckCheck /> Confirmar tudo ({confirmableCount})
          </Button>
        ) : null}
      </div>
    </div>
  );
}
