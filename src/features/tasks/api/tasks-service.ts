import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
} from "@/types/task";

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;

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
