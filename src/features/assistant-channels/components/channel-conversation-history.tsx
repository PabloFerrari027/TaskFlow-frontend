"use client";

import * as React from "react";
import { AlertTriangle, Loader2, MessageSquareText, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkdownContent } from "@/components/shared/markdown-content";
import {
  useChannelConversationsQuery,
  useChannelMessagesQuery,
} from "@/features/assistant-channels/hooks/use-assistant-channels";
import {
  END_REASON_LABEL,
  channelLabel,
} from "@/features/assistant-channels/lib/channel-labels";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatRelativeTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChannelConversation, ChannelMessage } from "@/types/assistant-channel";

function ConversationStatus({ conversation }: { conversation: ChannelConversation }) {
  if (!conversation.endedAt) return <Badge>Aberta</Badge>;
  const reason = conversation.endReason ? END_REASON_LABEL[conversation.endReason] : null;
  return <Badge variant="secondary">{reason ?? "Encerrada"}</Badge>;
}

const NOTICE_KINDS = new Set(["notice", "unsupported"]);

function MessageBubble({ message }: { message: ChannelMessage }) {
  const isUser = message.role === "user";
  const attachment = message.metadata?.attachment;
  const isNotice = NOTICE_KINDS.has(message.kind);

  return (
    <li className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-1 rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-primary/10 text-foreground" : "bg-muted text-foreground",
          isNotice && "border border-dashed border-border bg-transparent text-muted-foreground"
        )}
      >
        {attachment ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3" />
            {attachment.fileName ?? attachment.mediaType}
          </p>
        ) : null}
        {message.kind === "quick_reply" ? (
          <p className="italic">Tocou em “{message.content}”</p>
        ) : message.content ? (
          <MarkdownContent content={message.content} />
        ) : null}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {message.kind === "action_prompt" ? <span>Pedido de confirmação ·</span> : null}
          {formatTime(message.createdAt)}
          {message.metadata?.deliveryFailed ? (
            <span className="flex items-center gap-0.5 text-destructive">
              <AlertTriangle className="size-3" /> não entregue
            </span>
          ) : null}
        </p>
      </div>
    </li>
  );
}

function ConversationDialog({
  conversation,
  workspaceName,
  onClose,
}: {
  conversation: ChannelConversation | null;
  workspaceName: string;
  onClose: () => void;
}) {
  const messagesQuery = useChannelMessagesQuery(conversation?.id ?? null);
  const messages = messagesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Dialog open={conversation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        {conversation ? (
          <>
            <DialogHeader>
              <DialogTitle>Conversa pelo {channelLabel(conversation.channel)}</DialogTitle>
              <DialogDescription>
                {workspaceName} · {formatDateTime(conversation.startedAt)}
                {conversation.endedAt ? ` até ${formatDateTime(conversation.endedAt)}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="-mx-6 flex-1 overflow-y-auto px-6">
              {messagesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="ml-auto h-10 w-1/2" />
                  <Skeleton className="h-16 w-3/4" />
                </div>
              ) : messagesQuery.isError ? (
                <p className="text-sm text-destructive">{getErrorMessage(messagesQuery.error)}</p>
              ) : (
                <ul className="space-y-2 pb-2">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </ul>
              )}
              {messagesQuery.hasNextPage ? (
                <div className="flex justify-center pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messagesQuery.isFetchingNextPage}
                    onClick={() => messagesQuery.fetchNextPage()}
                  >
                    {messagesQuery.isFetchingNextPage ? <Loader2 className="animate-spin" /> : null}
                    Carregar mensagens seguintes
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Every conversation over the channels — open and ended. Nothing is deleted
 * by "nova", a workspace switch, idleness or unlinking; those only end one.
 */
export function ChannelConversationHistory({
  workspaceNames,
}: {
  workspaceNames: Map<string, string>;
}) {
  const conversationsQuery = useChannelConversationsQuery({});
  const [open, setOpen] = React.useState<ChannelConversation | null>(null);
  const conversations = conversationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const workspaceName = (workspaceId: string) =>
    workspaceNames.get(workspaceId) ?? "Outro workspace";

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (conversationsQuery.isError) {
    return <p className="text-sm text-destructive">{getErrorMessage(conversationsQuery.error)}</p>;
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareText className="size-6" />}
        title="Nenhuma conversa ainda"
        description="As conversas com o assistente pelo WhatsApp aparecem aqui."
        className="py-10"
      />
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
              onClick={() => setOpen(conversation)}
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {conversation.preview ?? "(sem texto)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {channelLabel(conversation.channel)} · {workspaceName(conversation.workspaceId)} ·{" "}
                  {conversation.messageCount}{" "}
                  {conversation.messageCount === 1 ? "mensagem" : "mensagens"} ·{" "}
                  {formatRelativeTime(conversation.lastMessageAt)}
                </p>
              </div>
              <ConversationStatus conversation={conversation} />
            </button>
          </li>
        ))}
      </ul>
      {conversationsQuery.hasNextPage ? (
        <Button
          variant="outline"
          size="sm"
          disabled={conversationsQuery.isFetchingNextPage}
          onClick={() => conversationsQuery.fetchNextPage()}
        >
          {conversationsQuery.isFetchingNextPage ? <Loader2 className="animate-spin" /> : null}
          Carregar mais
        </Button>
      ) : null}

      <ConversationDialog
        conversation={open}
        workspaceName={open ? workspaceName(open.workspaceId) : ""}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
