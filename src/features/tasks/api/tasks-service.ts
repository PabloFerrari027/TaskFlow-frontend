import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  BulkResult,
  BulkUpdateTaskItem,
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  DeletedTask,
  Task,
  UpdateTaskRequest,
} from "@/types/task";

// Server cap per bulk call (`MAX_BULK_TASKS_BATCH_SIZE`); a bigger batch is
// rejected outright with `BULK_BATCH_TOO_LARGE` without processing any item.
const MAX_BULK_BATCH_SIZE = 100;

// Splits `items` into calls of at most `MAX_BULK_BATCH_SIZE` and stitches the
// answers back into one result, as if it had been a single call: `index` is
// rewritten to be relative to the whole array. Calls run one after the other so
// the items keep being applied in the order given (positions depend on it).
async function runInBatches<TItem, TData>(
  items: TItem[],
  send: (batch: TItem[]) => Promise<BulkResult<TData>>
): Promise<BulkResult<TData>> {
  const merged: BulkResult<TData> = { total: 0, succeeded: 0, failed: 0, results: [] };

  for (let start = 0; start < items.length; start += MAX_BULK_BATCH_SIZE) {
    const batch = await send(items.slice(start, start + MAX_BULK_BATCH_SIZE));
    merged.total += batch.total;
    merged.succeeded += batch.succeeded;
    merged.failed += batch.failed;
    for (const result of batch.results) {
      merged.results.push({ ...result, index: result.index + start });
    }
  }

  return merged;
}

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const tasksService = {
  async listByProject(projectId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Task>>(
      `/projects/${projectId}/tasks`,
      { params }
    );
    return data;
  },

  async get(taskId: string) {
    const { data } = await apiClient.get<Task>(`/tasks/${taskId}`);
    return data;
  },

  async listSubtasks(taskId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Task>>(
      `/tasks/${taskId}/subtasks`,
      { params }
    );
    return data;
  },

  async listBySection(sectionId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Task>>(
      `/sections/${sectionId}/tasks`,
      { params }
    );
    return data;
  },

  async create(projectId: string, payload: CreateTaskRequest) {
    const { data } = await apiClient.post<Task>(
      `/projects/${projectId}/tasks`,
      payload
    );
    return data;
  },

  async update(taskId: string, payload: UpdateTaskRequest) {
    const { data } = await apiClient.patch<Task>(`/tasks/${taskId}`, payload);
    return data;
  },

  // The three bulk calls answer 200 even when every item fails: the outcome is
  // per item (`results`), with no rollback of the ones that went through.
  bulkCreate(projectId: string, tasks: CreateTaskRequest[]) {
    return runInBatches(tasks, async (batch) => {
      const { data } = await apiClient.post<BulkResult<Task>>(
        `/projects/${projectId}/tasks/bulk`,
        { tasks: batch }
      );
      return data;
    });
  },

  bulkUpdate(tasks: BulkUpdateTaskItem[]) {
    return runInBatches(tasks, async (batch) => {
      const { data } = await apiClient.patch<BulkResult<Task>>("/tasks/bulk", { tasks: batch });
      return data;
    });
  },

  bulkDelete(taskIds: string[]) {
    return runInBatches(taskIds, async (batch) => {
      const { data } = await apiClient.post<BulkResult<DeletedTask>>("/tasks/bulk-delete", {
        taskIds: batch,
      });
      return data;
    });
  },

  async changeStatus(taskId: string, payload: ChangeTaskStatusRequest) {
    const { data } = await apiClient.patch<Task>(
      `/tasks/${taskId}/status`,
      payload
    );
    return data;
  },

  async uploadAttachment(taskId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<Task>(
      `/tasks/${taskId}/attachments`,
      formData
    );
    return data;
  },

  async downloadAttachment(taskId: string, attachmentId: string) {
    const response = await apiClient.get(
      `/tasks/${taskId}/attachments/${attachmentId}/download`,
      { responseType: "blob" }
    );
    return response.data as Blob;
  },

  async removeAttachment(taskId: string, attachmentId: string) {
    const { data } = await apiClient.delete<Task>(
      `/tasks/${taskId}/attachments/${attachmentId}`
    );
    return data;
  },

  async setCover(taskId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.put<Task>(`/tasks/${taskId}/cover`, formData);
    return data;
  },

  async getCover(taskId: string) {
    const response = await apiClient.get(`/tasks/${taskId}/cover`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  // Idempotent on the server: a task without a cover comes back unchanged.
  async removeCover(taskId: string) {
    const { data } = await apiClient.delete<Task>(`/tasks/${taskId}/cover`);
    return data;
  },

  async addParticipant(taskId: string, userId: string) {
    const { data } = await apiClient.post<Task>(`/tasks/${taskId}/participants`, {
      userId,
    });
    return data;
  },

  async removeParticipant(taskId: string, userId: string) {
    const { data } = await apiClient.delete<Task>(
      `/tasks/${taskId}/participants/${userId}`
    );
    return data;
  },
};
