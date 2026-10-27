import { apiClient } from "@/lib/api/client";
import type { MyReminders } from "@/types/reminder";

export const remindersService = {
  async listMine(workspaceId: string) {
    const { data } = await apiClient.get<MyReminders>(`/workspaces/${workspaceId}/reminders`);
    return data;
  },

  // The item stays; only the reminder goes.
  async cancel(workspaceId: string, reminderId: string) {
    await apiClient.delete(`/workspaces/${workspaceId}/reminders/${reminderId}`);
  },

  // Items it already created stay.
  async stopRecurring(workspaceId: string, recurrenceId: string) {
    await apiClient.delete(`/workspaces/${workspaceId}/reminders/recurring/${recurrenceId}`);
  },
};
