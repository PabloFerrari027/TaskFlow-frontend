"use client";

import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCommentsQuery } from "@/features/comments/hooks/use-comments";
import { CommentItem } from "@/features/comments/components/comment-item";

export function CommentList({ taskId, projectId }: { taskId: string; projectId: string }) {
  const commentsQuery = useCommentsQuery(taskId);
  const comments = commentsQuery.data ?? [];

  if (commentsQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (commentsQuery.isError) {
    return <ErrorState error={commentsQuery.error} onRetry={() => commentsQuery.refetch()} />;
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-5" />}
        title="Nenhum comentário ainda"
        description="Seja o primeiro a comentar nesta tarefa."
      />
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} projectId={projectId} />
      ))}
    </div>
  );
}
