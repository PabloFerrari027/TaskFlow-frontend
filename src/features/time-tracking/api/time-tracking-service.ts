import { apiClient } from "@/lib/api/client";
import type { PaginationParams } from "@/types/common";
import type {
  LogTimeEntryRequest,
  ProjectTimeReport,
  StartTimerResult,
  TaskTimeEntries,
  TimeEntry,
  TimeReportGroupBy,
  UpdateTimeEntryRequest,
} from "@/types/time-tracking";

export const timeTrackingService = {
  // Starting on a task stops whatever timer was running (one per person).
  async start(taskId: string, note?: string) {
    const { data } = await apiClient.post<StartTimerResult>(`/tasks/${taskId}/timer/start`, { note });
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

  async listForTask(taskId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<TaskTimeEntries>(`/tasks/${taskId}/time-entries`, { params });
    return data;
  },

  async log(taskId: string, payload: LogTimeEntryRequest) {
    const { data } = await apiClient.post<TimeEntry>(`/tasks/${taskId}/time-entries`, payload);
    return data;
  },

  async update(entryId: string, payload: UpdateTimeEntryRequest) {
    const { data } = await apiClient.patch<TimeEntry>(`/time-entries/${entryId}`, payload);
    return data;
  },

  async remove(entryId: string) {
    await apiClient.delete(`/time-entries/${entryId}`);
  },

  async report(projectId: string, params: { groupBy: TimeReportGroupBy; from?: string; to?: string }) {
    const { data } = await apiClient.get<ProjectTimeReport>(`/projects/${projectId}/time-report`, {
      params,
    });
    return data;
  },
};
