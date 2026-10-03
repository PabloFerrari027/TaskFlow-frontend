"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { clearSession } from "@/lib/auth/token-store";
import type { AssistantChatEvent, ChatMessage } from "@/features/assistant/types";
import {
  AI_USAGE_QUERY_CACHE,
  buildAiUsageDateRange,
  type AiUsageFeature,
} from "@/types/ai-usage";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { TaskApproval } from "@/types/approval";

// Conversation state (transcript, pending action status) lives in the chat
// component's own reducer, never in TanStack Query — it's an ephemeral
// session, not cacheable server data (API.md § 16: stateless, no persisted
// history in v1). These hooks only wrap the three HTTP calls + their
// side effects.

const AI_USAGE_PAGE_SIZE = 20;

// Streams the turn (`POST /assistant/chat/stream`): progress frames go to
// `onEvent` as they arrive, and the mutation resolves with the final
// `done.result` — the same shape the JSON endpoint returns.
export function useSendChatMessageMutation(workspaceId: string) {
  return useMutation({
    mutationFn: ({
      message,
      history,
      files,
      onEvent,
      signal,
    }: {
      message: string;
      history: ChatMessage[];
      files?: File[];
      onEvent: (event: AssistantChatEvent) => void;
      signal?: AbortSignal;
    }) =>
      assistantService.streamChatMessage(message, workspaceId, history, files, {
        onEvent,
        signal,
      }),
    onError: (error, variables) => {
      // Aborted on purpose (the user closed the chat) — nothing to report.
      if (variables.signal?.aborted) return;
      // The chat shows a persistent notice for these (retrying can't help
      // until the provider account is topped up / the quota window resets),
      // so no toast on top of it.
      const code = getErrorCode(error);
      if (code === "AI_INSUFFICIENT_CREDITS" || code === "TOKEN_QUOTA_EXCEEDED") return;
      toast.error(getErrorMessage(error));
    },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.projectStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    case "update_task":
    case "assign_task":
    case "move_task": {
      const task = result as Task;
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    case "change_task_status": {
      const task = result as Task;
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
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
    case "request_task_approval": {
      const approval = result as TaskApproval;
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.task(approval.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    // `{ taskId, attached }` — the task may also be new (projectId + title).
    case "attach_files_to_task": {
      const { taskId } = result as { taskId: string };
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
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

// The period is a "last N days" preset, not fixed dates: `from`/`to` are built
// inside the queryFn so the key stays stable across renders. `from` is the
// start of the local day (N-1 days back) and `to` is now, so the span is always
// < N days and never trips the API's 90-day limit (API.md § 24).
export function useMyAiUsageQuery(
  params: {
    days: number;
    feature?: AiUsageFeature;
    page: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.aiUsage.me(params),
    queryFn: () =>
      assistantService.getMyAiUsage({
        ...buildAiUsageDateRange(params.days),
        feature: params.feature,
        page: params.page,
        limit: AI_USAGE_PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
    ...AI_USAGE_QUERY_CACHE,
    enabled: options?.enabled,
  });
}

export function useCancelPendingActionMutation() {
  return useMutation({
    mutationFn: (actionId: string) => assistantService.cancelPendingAction(actionId),
    onSuccess: () => toast.success("Ação cancelada."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
