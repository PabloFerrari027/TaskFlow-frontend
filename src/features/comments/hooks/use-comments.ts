"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addCommentReaction,
  createComment,
  deleteComment,
  listComments,
  removeCommentReaction,
  updateComment,
  type CommentReactionsResult,
} from "@/features/comments/api/comments-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityDelete } from "@/features/sync/lib/sync-engine";
import type { PaginatedResult } from "@/types/common";
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from "@/types/comment";

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

function patchComment(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  commentId: string,
  patch: (comment: Comment) => Comment
) {
  queryClient.setQueryData<PaginatedResult<Comment>>(queryKeys.comments.all(taskId), (current) =>
    current
      ? { ...current, data: current.data.map((c) => (c.id === commentId ? patch(c) : c)) }
      : current
  );
}

export function useUpdateCommentMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, payload }: { commentId: string; payload: UpdateCommentRequest }) =>
      updateComment(commentId, payload),
    onSuccess: (comment) => {
      patchComment(queryClient, taskId, comment.id, () => comment);
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.task(taskId) });
      toast.success("Comentário editado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Toggles the signed-in user's reaction with `emoji` (adds if absent, removes if present). */
export function useToggleCommentReactionMutation(taskId: string, currentUserId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, emoji, reacted }: { commentId: string; emoji: string; reacted: boolean }) =>
      reacted ? removeCommentReaction(commentId, emoji) : addCommentReaction(commentId, emoji),
    // The chip flips right away; the server's summary replaces it.
    onMutate: async ({ commentId, emoji, reacted }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.all(taskId) });
      const previous = queryClient.getQueryData<PaginatedResult<Comment>>(queryKeys.comments.all(taskId));
      if (currentUserId) {
        patchComment(queryClient, taskId, commentId, (comment) => {
          const reactions = (comment.reactions ?? [])
            .map((r) =>
              r.emoji !== emoji
                ? r
                : reacted
                  ? { ...r, count: r.count - 1, userIds: r.userIds.filter((id) => id !== currentUserId) }
                  : { ...r, count: r.count + 1, userIds: [...r.userIds, currentUserId] }
            )
            .filter((r) => r.count > 0);
          if (!reacted && !reactions.some((r) => r.emoji === emoji)) {
            reactions.push({ emoji, count: 1, userIds: [currentUserId] });
          }
          return { ...comment, reactions };
        });
      }
      return { previous };
    },
    onSuccess: (result: CommentReactionsResult) =>
      patchComment(queryClient, taskId, result.commentId, (comment) => ({
        ...comment,
        reactions: result.reactions,
      })),
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.comments.all(taskId), context.previous);
      toast.error(getErrorMessage(error));
    },
  });
}
