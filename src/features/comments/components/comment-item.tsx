"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";
import { useDeleteCommentMutation } from "@/features/comments/hooks/use-comments";
import type { Comment } from "@/types/comment";

export function CommentItem({ comment, projectId }: { comment: Comment; projectId: string }) {
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
          {canDelete ? (
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
          ) : null}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
      </div>
    </div>
  );
}
