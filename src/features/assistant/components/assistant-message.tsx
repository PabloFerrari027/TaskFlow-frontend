"use client";

import { Mic, Paperclip } from "lucide-react";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { cn } from "@/lib/utils";
import { PendingActionCard } from "@/features/assistant/components/pending-action-card";
import type { ChatTranscriptMessage, PendingActionLocalStatus } from "@/features/assistant/types";

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

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%] space-y-2">
        <div className={cn("rounded-lg px-3 py-2", isUser ? "bg-primary" : "bg-muted")}>
          <MarkdownContent
            content={message.content}
            className={isUser ? USER_BUBBLE_MARKDOWN_CLASS : undefined}
          />
        </div>

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

        {/* Always empty in v1 (API.md § 16) — rendered defensively for when
            that changes, per the transparency requirement: a concluded
            action is shown, never just implied by the reply text. */}
        {message.executedActions && message.executedActions.length > 0 ? (
          <div className="space-y-1">
            {message.executedActions.map((action, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                ✅ {action.tool}
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
