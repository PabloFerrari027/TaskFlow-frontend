"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commentsService } from "@/features/comments/api/comments-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityDelete } from "@/features/sync/lib/sync-engine";
import type { CreateCommentRequest } from "@/types/comment";

// A task's comment thread is realistically short — fetch the max page size
// once instead of paging a chat-style feed, same call as `useSubtasksQuery`.
export function useCommentsQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.comments.all(taskId),
    queryFn: () => commentsService.listByTask(taskId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useCreateCommentMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentRequest) => commentsService.create(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all(taskId) });
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
      return commentsService.remove(commentId).then(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all(taskId) });
      toast.success(
        isOffline()
          ? "Exclusão salva offline — será sincronizada quando a conexão voltar."
          : "Comentário apagado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
