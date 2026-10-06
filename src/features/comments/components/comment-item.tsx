"use client";

import * as React from "react";
import { Pencil, Reply, SmilePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { extractMentionedUserIds, splitMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/items/hooks/use-assignable-members";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";
import {
  useDeleteCommentMutation,
  useToggleCommentReactionMutation,
  useUpdateCommentMutation,
} from "@/features/comments/hooks/use-comments";
import { useMemberName } from "@/features/items/components/item-assignees-field";
import type { Comment } from "@/types/comment";

interface CommentItemProps {
  comment: Comment;
  folderId: string;
  hasReplies: boolean;
  onReply: () => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "😄", "👀", "🙏", "✅", "🔥"];

function Reactions({ comment, folderId }: { comment: Comment; folderId: string }) {
  const { userId: currentUserId } = useAuth();
  const memberName = useMemberName(folderId);
  const toggle = useToggleCommentReactionMutation(comment.itemId, currentUserId);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const reactions = comment.reactions ?? [];

  function react(emoji: string) {
    const reacted = !!currentUserId && !!reactions.find((r) => r.emoji === emoji)?.userIds.includes(currentUserId);
    toggle.mutate({ commentId: comment.id, emoji, reacted });
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => {
        const mine = !!currentUserId && reaction.userIds.includes(currentUserId);
        return (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => react(reaction.emoji)}
                aria-pressed={mine}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs transition-colors",
                  mine ? "border-primary/50 bg-primary/10 text-primary" : "border-border hover:bg-muted"
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{reaction.userIds.map(memberName).join(", ")}</TooltipContent>
          </Tooltip>
        );
      })}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button size="icon-xs" variant="ghost" aria-label="Reagir" title="Reagir">
            <SmilePlus />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" align="start">
          <div className="flex gap-0.5">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-md p-1.5 text-lg leading-none hover:bg-muted"
                aria-label={`Reagir com ${emoji}`}
                onClick={() => {
                  react(emoji);
                  setPickerOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CommentItem({ comment, folderId, hasReplies, onReply }: CommentItemProps) {
  const { userId: currentUserId } = useAuth();
  const { canManage } = useFolderPermission(folderId);
  const deleteMutation = useDeleteCommentMutation(comment.itemId);
  const updateMutation = useUpdateCommentMutation(comment.itemId);
  const { userIds: memberIds, names } = useAssignableMembers(folderId);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(comment.content);

  const isAuthor = comment.authorId === currentUserId;
  const canDelete = canManage || isAuthor;

  function saveEdit() {
    const content = draft.trim();
    if (!content) return;
    if (content === comment.content) {
      setEditing(false);
      return;
    }
    updateMutation.mutate(
      {
        commentId: comment.id,
        // The complete set after the edit — a deleted "@Ana" stops being a mention.
        payload: { content, mentionedUserIds: extractMentionedUserIds(content, memberIds, names) },
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <MemberAvatar userId={comment.authorId} className="mt-0.5" />
      <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MemberIdLabel userId={comment.authorId} />
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
              {comment.editedAt ? (
                <span title={`Editado ${formatRelativeTime(comment.editedAt)}`}> · editado</span>
              ) : null}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button size="xs" variant="ghost" onClick={onReply}>
              <Reply /> Responder
            </Button>
            {isAuthor && !editing ? (
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Editar comentário"
                title="Editar"
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(true);
                }}
              >
                <Pencil />
              </Button>
            ) : null}
            {canDelete ? (
              hasReplies ? (
                // The API refuses to delete a comment that still has replies
                // (COMMENT_HAS_CHILDREN), so don't offer a delete that can only fail.
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled
                  title="Apague as respostas deste comentário antes de apagá-lo."
                >
                  <Trash2 className="text-destructive" />
                </Button>
              ) : (
                <ConfirmDialog
                  trigger={
                    <Button size="icon-xs" variant="ghost">
                      <Trash2 className="text-destructive" />
                    </Button>
                  }
                  title="Apagar comentário"
                  description="Esta ação não pode ser desfeita."
                  confirmLabel="Apagar"
                  isLoading={deleteMutation.isPending}
                  onConfirm={() => deleteMutation.mutate(comment.id)}
                />
              )
            ) : null}
          </div>
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <MentionTextarea
              folderId={folderId}
              rows={3}
              autoFocus
              value={draft}
              onChange={setDraft}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditing(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>
                Cancelar
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={!draft.trim() || updateMutation.isPending}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
          {splitMentions(comment.content, comment.mentionedUserIds ?? [], names).map((part, i) =>
            part.mention ? (
              <span key={i} className="rounded bg-primary/10 px-0.5 font-medium text-primary">
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )}
        </p>
        )}
        <Reactions comment={comment} folderId={folderId} />
      </div>
    </div>
  );
}
