"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { clearSession } from "@/lib/auth/token-store";
import type { ChatMessage } from "@/features/assistant/types";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

// Conversation state (transcript, pending action status) lives in the chat
// component's own reducer, never in TanStack Query — it's an ephemeral
// session, not cacheable server data (API.md § 16: stateless, no persisted
// history in v1). These hooks only wrap the three HTTP calls + their
// side effects.

export function useSendChatMessageMutation(workspaceId: string) {
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
      assistantService.sendChatMessage(message, workspaceId, history),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Every write tool, mapped explicitly to what it invalidates/updates —
 * deliberately not a generic "invalidate everything" fallback (per the
 * prompt's own instruction). Each `result` is the same DTO shape the
 * equivalent REST endpoint returns, since `confirm` calls the exact same
 * Use Case (API.md § 16).
 */
function applyConfirmedActionEffects(
  queryClient: QueryClient,
  workspaceId: string,
  tool: string,
  result: unknown
): void {
  switch (tool) {
    case "create_workspace":
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
      return;
    case "update_workspace":
      queryClient.setQueryData(queryKeys.workspaces.detail(workspaceId), result);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
      return;
    case "invite_workspace_member":
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.invitations(workspaceId) });
      return;
    case "delete_workspace":
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
      return;
    case "remove_workspace_member":
      queryClient.setQueryData(queryKeys.workspaces.detail(workspaceId), result);
      return;
    case "create_project":
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
      return;
    case "update_project":
    case "archive_project": {
      const project = result as Project;
      queryClient.setQueryData(queryKeys.projects.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
      return;
    }
    case "create_task": {
      const task = result as Task;
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      return;
    }
    case "update_task":
    case "assign_task":
    case "move_task": {
      const task = result as Task;
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      return;
    }
    case "change_task_status": {
      const task = result as Task;
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      if (task.parentTaskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(task.parentTaskId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(task.id) });
      return;
    }
    case "add_task_participant":
    case "remove_task_participant": {
      const task = result as Task;
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      return;
    }
    case "revoke_session":
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
      return;
    default:
      return;
  }
}

export function useConfirmPendingActionMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      actionId,
      reauth,
    }: {
      actionId: string;
      tool: string;
      isCurrentSession?: boolean;
      reauth?: { password: string } | { googleIdToken: string };
    }) => assistantService.confirmPendingAction(actionId, reauth),
    onSuccess: (data, variables) => {
      applyConfirmedActionEffects(queryClient, workspaceId, variables.tool, data.result);

      // The session that just got revoked is this browser's own — the
      // server already logged it out, so just clear local state and leave.
      // Never call sessionsService.revoke again here: that would send a
      // second request using a token that's already been invalidated.
      if (variables.tool === "revoke_session" && variables.isCurrentSession) {
        clearSession();
        toast.success("Sessão encerrada. Você foi desconectado.");
        router.push("/login");
        return;
      }

      toast.success("Ação confirmada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelPendingActionMutation() {
  return useMutation({
    mutationFn: (actionId: string) => assistantService.cancelPendingAction(actionId),
    onSuccess: () => toast.success("Ação cancelada."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
