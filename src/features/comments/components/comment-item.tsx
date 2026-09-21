"use client";

import { Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { splitMentions } from "@/lib/mentions";
import { useAuth } from "@/lib/auth/auth-context";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";
import { useDeleteCommentMutation } from "@/features/comments/hooks/use-comments";
import type { Comment } from "@/types/comment";

interface CommentItemProps {
  comment: Comment;
  projectId: string;
  hasReplies: boolean;
  onReply: () => void;
}

export function CommentItem({ comment, projectId, hasReplies, onReply }: CommentItemProps) {
  const { userId: currentUserId } = useAuth();
  const { canManage } = useProjectPermission(projectId);
  const deleteMutation = useDeleteCommentMutation(comment.taskId);

  const canDelete = canManage || comment.authorId === currentUserId;

  return (
    <div className="flex items-start gap-2.5">
      <MemberAvatar userId={comment.authorId} className="mt-0.5" />
      <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MemberIdLabel userId={comment.authorId} />
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button size="xs" variant="ghost" onClick={onReply}>
              <Reply /> Responder
            </Button>
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
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
          {splitMentions(comment.content, comment.mentionedUserIds ?? []).map((part, i) =>
            part.mention ? (
              <span key={i} className="rounded bg-primary/10 px-0.5 font-medium text-primary">
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )}
        </p>
      </div>
    </div>
  );
}
