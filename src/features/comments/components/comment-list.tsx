"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCommentsQuery } from "@/features/comments/hooks/use-comments";
import { CommentNode } from "@/features/comments/components/comment-thread";
import { buildTree } from "@/lib/tree";

export function CommentList({ taskId, projectId }: { taskId: string; projectId: string }) {
  const commentsQuery = useCommentsQuery(taskId);
  const comments = commentsQuery.data ?? [];
  // Replies arrive as a flat list (oldest first) linked by parentId; rebuild the
  // thread client-side. Replies whose parent is gone just render where they land.
  const threads = React.useMemo(() => buildTree(comments), [comments]);

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
      {threads.map((thread) => (
        <CommentNode key={thread.item.id} node={thread} level={0} projectId={projectId} />
      ))}
    </div>
  );
}
