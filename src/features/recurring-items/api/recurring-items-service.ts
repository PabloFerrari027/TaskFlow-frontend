import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateItemRecurrenceRequest,
  RecurrencePreview,
  RecurrenceSchedule,
  ItemRecurrence,
  UpdateItemRecurrenceRequest,
} from "@/types/recurrence";

const base = (folderId: string) => `/folders/${folderId}/recurring-items`;

export const recurringItemsService = {
  async list(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<ItemRecurrence>>(base(folderId), {
      params,
    });
    return data;
  },

  async create(folderId: string, payload: CreateItemRecurrenceRequest) {
    const { data } = await apiClient.post<ItemRecurrence>(base(folderId), payload);
    return data;
  },

  async update(folderId: string, recurrenceId: string, payload: UpdateItemRecurrenceRequest) {
    const { data } = await apiClient.patch<ItemRecurrence>(
      `${base(folderId)}/${recurrenceId}`,
      payload
    );
    return data;
  },

  async remove(folderId: string, recurrenceId: string) {
    await apiClient.delete(`${base(folderId)}/${recurrenceId}`);
  },

  // Saves nothing: the normalized schedule and its next 5 occurrences.
  async preview(folderId: string, schedule: RecurrenceSchedule) {
    const { data } = await apiClient.post<RecurrencePreview>(`${base(folderId)}/preview`, {
      schedule,
    });
    return data;
  },
};
