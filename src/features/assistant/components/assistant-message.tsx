"use client";

import { cn } from "@/lib/utils";
import { PendingActionCard } from "@/features/assistant/components/pending-action-card";
import type { ChatTranscriptMessage, PendingActionLocalStatus } from "@/features/assistant/types";

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
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          {message.content}
        </div>

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
