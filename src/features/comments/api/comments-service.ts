import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  Comment,
  CommentReaction,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@/types/comment";

export async function listComments(taskId: string, params?: PaginationParams) {
  const { data } = await apiClient.get<PaginatedResult<Comment>>(
    `/tasks/${taskId}/comments`,
    { params }
  );
  return data;
}

export async function createComment(taskId: string, payload: CreateCommentRequest) {
  const { data } = await apiClient.post<Comment>(`/tasks/${taskId}/comments`, payload);
  return data;
}

export async function deleteComment(commentId: string) {
  const { data } = await apiClient.delete<{ id: string; taskId: string }>(
    `/comments/${commentId}`
  );
  return data;
}

// Only the author can edit; `mentionedUserIds` is the complete set after the edit.
export async function updateComment(commentId: string, payload: UpdateCommentRequest) {
  const { data } = await apiClient.patch<Comment>(`/comments/${commentId}`, payload);
  return data;
}

export interface CommentReactionsResult {
  commentId: string;
  taskId: string;
  reactions: CommentReaction[];
}

// Both are idempotent: reacting twice with the same emoji is a no-op.
export async function addCommentReaction(commentId: string, emoji: string) {
  const { data } = await apiClient.post<CommentReactionsResult>(
    `/comments/${commentId}/reactions`,
    { emoji }
  );
  return data;
}

export async function removeCommentReaction(commentId: string, emoji: string) {
  const { data } = await apiClient.delete<CommentReactionsResult>(
    `/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`
  );
  return data;
}
