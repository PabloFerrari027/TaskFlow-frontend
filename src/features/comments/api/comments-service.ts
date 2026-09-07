import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { Comment, CreateCommentRequest } from "@/types/comment";

export const commentsService = {
  async listByTask(taskId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Comment>>(
      `/tasks/${taskId}/comments`,
      { params }
    );
    return data;
  },

  async create(taskId: string, payload: CreateCommentRequest) {
    const { data } = await apiClient.post<Comment>(
      `/tasks/${taskId}/comments`,
      payload
    );
    return data;
  },

  async remove(commentId: string) {
    const { data } = await apiClient.delete<{ id: string; taskId: string }>(
      `/comments/${commentId}`
    );
    return data;
  },
};
