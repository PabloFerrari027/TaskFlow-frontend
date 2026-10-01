import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateTaskRecurrenceRequest,
  RecurrencePreview,
  RecurrenceSchedule,
  TaskRecurrence,
  UpdateTaskRecurrenceRequest,
} from "@/types/recurrence";

const base = (projectId: string) => `/projects/${projectId}/recurring-tasks`;

export const recurringTasksService = {
  async list(projectId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<TaskRecurrence>>(base(projectId), {
      params,
    });
    return data;
  },

  async create(projectId: string, payload: CreateTaskRecurrenceRequest) {
    const { data } = await apiClient.post<TaskRecurrence>(base(projectId), payload);
    return data;
  },

  async update(projectId: string, recurrenceId: string, payload: UpdateTaskRecurrenceRequest) {
    const { data } = await apiClient.patch<TaskRecurrence>(
      `${base(projectId)}/${recurrenceId}`,
      payload
    );
    return data;
  },

  async remove(projectId: string, recurrenceId: string) {
    await apiClient.delete(`${base(projectId)}/${recurrenceId}`);
  },

  // Saves nothing: the normalized schedule and its next 5 occurrences.
  async preview(projectId: string, schedule: RecurrenceSchedule) {
    const { data } = await apiClient.post<RecurrencePreview>(`${base(projectId)}/preview`, {
      schedule,
    });
    return data;
  },
};
