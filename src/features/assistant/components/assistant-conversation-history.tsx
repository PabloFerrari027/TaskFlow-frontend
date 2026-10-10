"use client";

import { Loader2, MessagesSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useAssistantConversationsQuery,
  useDeleteAssistantConversationMutation,
} from "@/features/assistant/hooks/use-assistant";
import { getErrorMessage } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The user's saved chats in the current workspace, newest first. Picking one
 * resumes it in the chat; the WhatsApp conversations live on the Assistente
 * page instead (API.md § 28).
 */
export function AssistantConversationHistory({
  workspaceId,
  activeConversationId,
  loadingConversationId,
  onSelect,
  onDeleted,
}: {
  workspaceId: string;
  activeConversationId: string | null;
  loadingConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onDeleted: (conversationId: string) => void;
}) {
  const conversationsQuery = useAssistantConversationsQuery(workspaceId);
  const deleteMutation = useDeleteAssistantConversationMutation();
  const conversations = conversationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
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
        icon={<MessagesSquare className="size-5" />}
        title="Nenhuma conversa ainda"
        description="Suas conversas com o assistente neste workspace aparecem aqui para você continuar depois."
        className="py-10"
      />
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const isLoading = conversation.id === loadingConversationId;
          return (
            <li key={conversation.id} className="group relative">
              <button
                type="button"
                disabled={loadingConversationId !== null}
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "w-full rounded-lg border border-border/60 py-2.5 pr-11 pl-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-wait",
                  isActive && "border-primary/40 bg-primary/5"
                )}
              >
                <p className="line-clamp-2 text-sm text-foreground">{conversation.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isLoading ? <Loader2 className="size-3 animate-spin" /> : null}
                  {isActive ? "Conversa atual · " : ""}
                  {formatRelativeTime(conversation.lastMessageAt)} ·{" "}
                  {conversation.messageCount === 1
                    ? "1 mensagem"
                    : `${conversation.messageCount} mensagens`}
                </p>
              </button>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Apagar conversa"
                    title="Apagar conversa"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                }
                title="Apagar esta conversa?"
                description="A conversa sai do seu histórico e não dá para recuperar. O que o assistente já fez nas suas pastas e itens continua como está."
                confirmLabel="Apagar"
                isLoading={deleteMutation.isPending}
                onConfirm={() =>
                  deleteMutation.mutate(conversation.id, {
                    onSuccess: () => onDeleted(conversation.id),
                  })
                }
              />
            </li>
          );
        })}
      </ul>
      {conversationsQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={conversationsQuery.isFetchingNextPage}
            onClick={() => conversationsQuery.fetchNextPage()}
            loading={conversationsQuery.isFetchingNextPage}
          >
            Ver conversas mais antigas
          </Button>
        </div>
      ) : null}
    </div>
  );
}
