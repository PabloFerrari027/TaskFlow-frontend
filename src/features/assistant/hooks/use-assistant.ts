"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { clearSession } from "@/lib/auth/token-store";
import type { AssistantChatEvent } from "@/features/assistant/types";
import {
  AI_USAGE_QUERY_CACHE,
  buildAiUsageDateRange,
  type AiUsageFeature,
} from "@/types/ai-usage";
import type { Folder } from "@/types/folder";
import type { Item } from "@/types/item";
import type { ItemApproval } from "@/types/approval";

// The live transcript (streaming reply, pending action status) lives in the
// chat component's own reducer. The saved chat itself (one per user, API.md
// § 16) is regular server data: its pages are read with the hooks below and
// folded into that transcript.

const AI_USAGE_PAGE_SIZE = 20;

// Streams the turn (`POST /assistant/chat/stream`): progress frames go to
// `onEvent` as they arrive, and the mutation resolves with the final
// `done.result` — the same shape the JSON endpoint returns.
export function useSendChatMessageMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      message,
      files,
      start,
      onEvent,
      signal,
    }: {
      message: string;
      files?: File[];
      // Opening message of an empty chat — no text, no files.
      start?: boolean;
      onEvent: (event: AssistantChatEvent) => void;
      signal?: AbortSignal;
    }) =>
      assistantService.streamChatMessage(message, workspaceId, files, {
        onEvent,
        signal,
        start,
      }),
    // Writes that ran without a confirmation (capture tools) come back here,
    // not through `confirm` — apply the same cache effects to them. Read tools
    // fall through the switch's default.
    onSuccess: (data) => {
      for (const action of data.executedActions) {
        applyConfirmedActionEffects(queryClient, workspaceId, action.tool, action.result);
      }
      // The onboarding may have ended and the summary changed this turn.
      queryClient.invalidateQueries({ queryKey: queryKeys.assistantConversation.profile() });
    },
    onError: (error, variables) => {
      // Aborted on purpose (the user closed the chat) — nothing to report.
      if (variables.signal?.aborted) return;
      // The opening was already written (another tab) — the chat reloads instead.
      if (getErrorCode(error) === "ASSISTANT_CONVERSATION_NOT_EMPTY") return;
      // The chat shows a persistent notice for these (retrying can't help
      // until the provider account is topped up / the quota window resets),
      // so no toast on top of it.
      const code = getErrorCode(error);
      if (code === "AI_INSUFFICIENT_CREDITS" || code === "TOKEN_QUOTA_EXCEEDED") return;
      toast.error(getErrorMessage(error));
    },
  });
}

function invalidateCapturedPlaces(queryClient: QueryClient, workspaceId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.sections.byFolderAll() });
  queryClient.invalidateQueries({ queryKey: queryKeys.items.byFolderAll() });
  queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
  queryClient.invalidateQueries({ queryKey: queryKeys.items.trashAll() });
  queryClient.invalidateQueries({ queryKey: queryKeys.comments.byItemAll() });
  queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
  queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
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
    case "create_folder":
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
      return;
    case "update_folder":
    case "archive_folder": {
      const folder = result as Folder;
      queryClient.setQueryData(queryKeys.folders.detail(folder.id), folder);
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
      return;
    }
    case "create_item": {
      const item = result as Item;
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    case "update_item":
    case "assign_item":
    case "move_item": {
      const item = result as Item;
      queryClient.setQueryData(queryKeys.items.detail(item.id), item);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    case "change_item_status": {
      const item = result as Item;
      queryClient.setQueryData(queryKeys.items.detail(item.id), item);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      if (item.parentItemId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.subitems(item.parentItemId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.items.subitems(item.id) });
      return;
    }
    case "add_item_participant":
    case "remove_item_participant": {
      const item = result as Item;
      queryClient.setQueryData(queryKeys.items.detail(item.id), item);
      return;
    }
    case "request_item_approval": {
      const approval = result as ItemApproval;
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.item(approval.itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    // `{ itemId, attached }` — the item may also be new (folderId + title).
    case "attach_files_to_item": {
      const { itemId } = result as { itemId: string };
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      return;
    }
    // Capture tools run without confirmation and arrive as `executedActions`.
    // Their results name places by label only (no folderId), and one call may
    // create a folder, create an item, append a comment, move items or send an
    // item to the trash — so they refresh those families broadly.
    case "save_information":
    case "undo_saved_information":
    case "relocate_information":
    case "organize_information":
      invalidateCapturedPlaces(queryClient, workspaceId);
      return;
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
      // No toast: the card itself turns into "Confirmado", and a toast sat on top of the chat.
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

// Only the newest page is read up front: the chat opens on the latest
// messages, and older ones are loaded on demand ("Ver mensagens anteriores").
const CONVERSATION_MESSAGES_PAGE_SIZE = 30;

export function useAssistantConversationMessagesQuery(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: queryKeys.assistantConversation.messages(),
    queryFn: ({ pageParam }) =>
      assistantService.listConversationMessages({
        limit: CONVERSATION_MESSAGES_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    // The live transcript takes over once loaded — refetching on focus would
    // only shuffle pages under it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
}

export function useClearAssistantConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => assistantService.clearConversation(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.assistantConversation.messages() });
      toast.success("Conversa limpa.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAssistantProfileQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.assistantConversation.profile(),
    queryFn: () => assistantService.getProfile(),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateAssistantProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (summary: string | null) => assistantService.updateProfile(summary),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.assistantConversation.profile(), profile);
      toast.success(profile.summary ? "Pronto, atualizado." : "Apagado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelPendingActionMutation() {
  return useMutation({
    mutationFn: (actionId: string) => assistantService.cancelPendingAction(actionId),
    // No toast: the card itself says it was cancelled.
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
