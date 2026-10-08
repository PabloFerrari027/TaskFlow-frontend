"use client";

import { Loader2, Mic, Paperclip } from "lucide-react";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { cn } from "@/lib/utils";
import { PendingActionCard } from "@/features/assistant/components/pending-action-card";
import { TypingIndicator } from "@/features/assistant/components/typing-indicator";
import { toolLabel } from "@/features/assistant/lib/tool-labels";
import type {
  AssistantChatStage,
  AssistantChatStatus,
  ChatTranscriptMessage,
  PendingActionLocalStatus,
} from "@/features/assistant/types";

// The API only reports *which* stage the assistant is in — the wording is
// ours, kept plain for non-technical users.
const STAGE_LABEL: Record<Exclude<AssistantChatStage, "running_tool">, string> = {
  transcribing: "Ouvindo seu áudio...",
  reading_attachments: "Lendo os anexos...",
  loading_context: "Olhando o seu workspace...",
  thinking: "Pensando...",
  checking_content: "Revisando a resposta...",
};

// Tools that run right away: reads, plus the capture tools that write without
// a confirmation. Any other tool registers an action for the user to confirm,
// so it gets the generic "preparing" label.
const READ_TOOL_LABEL: Record<string, string> = {
  list_items: "Consultando os itens...",
  list_folders: "Consultando as pastas...",
  list_workspaces: "Consultando os workspaces...",
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
}: {
  message: ChatTranscriptMessage;
  workspaceId: string;
  onPendingActionStatusChange: (actionId: string, status: PendingActionLocalStatus) => void;
}) {
  const isUser = message.role === "user";
  const isStreaming = message.streamingStatus !== undefined;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%] space-y-2">
        {isStreaming && !message.content ? (
          <TypingIndicator />
        ) : message.content || !isUser ? (
          <div className={cn("rounded-lg px-3 py-2", isUser ? "bg-primary" : "bg-muted")}>
            <MarkdownContent
              content={message.content}
              className={isUser ? USER_BUBBLE_MARKDOWN_CLASS : undefined}
            />
          </div>
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

        {message.attachments && message.attachments.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {message.attachments.map((attachment, index) => (
              <span
                key={index}
                className="flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {attachment.isAudio ? (
                  <Mic className="size-3" />
                ) : (
                  <Paperclip className="size-3" />
                )}
                <span className="max-w-35 truncate">{attachment.fileName}</span>
              </span>
            ))}
          </div>
        ) : null}

        {/* Reads and the capture tools (which run without a confirmation)
            land here. Transparency requirement (API.md § 16): a concluded
            action is shown, never just implied by the reply text. */}
        {message.executedActions && message.executedActions.length > 0 ? (
          <div className="space-y-1">
            {message.executedActions.map((action, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                ✅ {toolLabel(action.tool)}
              </p>
            ))}
          </div>
        ) : null}

        {message.pendingActions?.map((pendingAction) => (
          <PendingActionCard
            key={pendingAction.id}
            pendingAction={pendingAction}
            workspaceId={workspaceId}
            onStatusChange={(status) => onPendingActionStatusChange(pendingAction.id, status)}
          />
        ))}
      </div>
    </div>
  );
}
