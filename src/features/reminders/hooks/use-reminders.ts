"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { remindersService } from "@/features/reminders/api/reminders-service";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";

export function useMyRemindersQuery() {
  const { workspaceId } = useCurrentWorkspace();
  return useQuery({
    queryKey: queryKeys.reminders.mine(workspaceId ?? ""),
    queryFn: () => remindersService.listMine(workspaceId!),
    enabled: Boolean(workspaceId),
  });
}

function useInvalidateReminders() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reminders.root() });
    // A stopped repeating reminder also leaves the folder's "Lembretes" tab.
    queryClient.invalidateQueries({ queryKey: ["recurring-items"] });
  };
}

export function useCancelReminderMutation() {
  const { workspaceId } = useCurrentWorkspace();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (reminderId: string) => remindersService.cancel(workspaceId!, reminderId),
    onSuccess: () => {
      invalidate();
      toast.success("Pronto, esse aviso não vai mais tocar.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useStopRecurringReminderMutation() {
  const { workspaceId } = useCurrentWorkspace();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (recurrenceId: string) => remindersService.stopRecurring(workspaceId!, recurrenceId),
    onSuccess: () => {
      invalidate();
      toast.success("Pronto, não vou mais lembrar disso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
