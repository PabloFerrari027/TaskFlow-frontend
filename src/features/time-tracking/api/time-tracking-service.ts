import { apiClient } from "@/lib/api/client";
import type { PaginationParams } from "@/types/common";
import type {
  LogTimeEntryRequest,
  FolderTimeReport,
  StartTimerResult,
  ItemTimeEntries,
  TimeEntry,
  TimeReportGroupBy,
  UpdateTimeEntryRequest,
} from "@/types/time-tracking";

export const timeTrackingService = {
  // Starting on an item stops whatever timer was running (one per person).
  async start(itemId: string, note?: string) {
    const { data } = await apiClient.post<StartTimerResult>(`/items/${itemId}/timer/start`, { note });
    return data;
  },

  async stop() {
    const { data } = await apiClient.post<TimeEntry>("/timer/stop");
    return data;
  },

  async running() {
    const { data } = await apiClient.get<{ running: TimeEntry | null }>("/timer");
    return data.running;
  },

  async listForItem(itemId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<ItemTimeEntries>(`/items/${itemId}/time-entries`, { params });
    return data;
  },

  async log(itemId: string, payload: LogTimeEntryRequest) {
    const { data } = await apiClient.post<TimeEntry>(`/items/${itemId}/time-entries`, payload);
    return data;
  },

  async update(entryId: string, payload: UpdateTimeEntryRequest) {
    const { data } = await apiClient.patch<TimeEntry>(`/time-entries/${entryId}`, payload);
    return data;
  },

  async remove(entryId: string) {
    await apiClient.delete(`/time-entries/${entryId}`);
  },

  async report(folderId: string, params: { groupBy: TimeReportGroupBy; from?: string; to?: string }) {
    const { data } = await apiClient.get<FolderTimeReport>(`/folders/${folderId}/time-report`, {
      params,
    });
    return data;
  },
};
