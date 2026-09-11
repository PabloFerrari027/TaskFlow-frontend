"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createComment, deleteComment, listComments } from "@/features/comments/api/comments-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityDelete } from "@/features/sync/lib/sync-engine";
import type { PaginatedResult } from "@/types/common";
import type { Comment, CreateCommentRequest } from "@/types/comment";

// A task's comment thread is realistically short — fetch the max page size
// once instead of paging a chat-style feed, same call as `useSubtasksQuery`.
export function useCommentsQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.comments.all(taskId),
    queryFn: () => listComments(taskId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useCreateCommentMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentRequest) => createComment(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all(taskId) });
      // The task's unified activity timeline includes comment events too
      // (API.md § 14), so a new comment needs to invalidate both.
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.task(taskId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCommentMutation(taskId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (commentId: string) => {
      if (isOffline() && workspaceId) {
        // Comments aren't versioned (API.md § 17) — there's no baseVersion
        // to send, so this delete just replays whenever it reaches the
        // server, same as an online request would.
        queueEntityDelete({
          workspaceId,
          entityType: "COMMENT",
          entityId: commentId,
          baseVersion: null,
          meta: { taskId },
        });
        return Promise.resolve();
      }
      return deleteComment(commentId).then(() => undefined);
    },
    // Offline deletes only reach the server on the next sync pull, and
    // invalidateQueries' refetch stays paused (networkMode: "online") until
    // then — without this optimistic removal, a comment deleted offline
    // would stay visible until reconnect instead of disappearing right away.
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.all(taskId) });
      const previous = queryClient.getQueryData<PaginatedResult<Comment>>(
        queryKeys.comments.all(taskId)
      );
      if (previous) {
        queryClient.setQueryData<PaginatedResult<Comment>>(queryKeys.comments.all(taskId), {
          ...previous,
          data: previous.data.filter((comment) => comment.id !== commentId),
        });
      }
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all(taskId) });
      toast.success(
        isOffline()
          ? "Exclusão salva offline — será sincronizada quando a conexão voltar."
          : "Comentário apagado."
      );
    },
    onError: (error, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.comments.all(taskId), context.previous);
      }
      toast.error(getErrorMessage(error));
    },
  });
}
