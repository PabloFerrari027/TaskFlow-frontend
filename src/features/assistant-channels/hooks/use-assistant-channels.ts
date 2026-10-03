"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { assistantChannelsService } from "@/features/assistant-channels/api/assistant-channels-service";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type {
  AssistantChannel,
  AssistantChannelId,
  AssistantChannelLink,
  ListChannelConversationsParams,
  StartChannelVerificationRequest,
} from "@/types/assistant-channel";

const CONVERSATIONS_PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 100;

export function useAssistantChannelsQuery() {
  return useQuery({
    queryKey: queryKeys.assistantChannels.list(),
    queryFn: () => assistantChannelsService.list(),
  });
}

function setLink(
  queryClient: QueryClient,
  channel: AssistantChannelId,
  link: AssistantChannelLink | null
) {
  queryClient.setQueryData<AssistantChannel[]>(queryKeys.assistantChannels.list(), (current) =>
    current?.map((item) => (item.channel === channel ? { ...item, link } : item))
  );
  // Linking, switching and unlinking all close the open conversation.
  queryClient.invalidateQueries({ queryKey: [...queryKeys.assistantChannels.root(), "conversations"] });
}

// Errors are shown inline by the verification form, not as toasts.
export function useStartChannelVerificationMutation(channel: AssistantChannelId) {
  return useMutation({
    mutationFn: (payload: StartChannelVerificationRequest) =>
      assistantChannelsService.startVerification(channel, payload),
  });
}

export function useConfirmChannelVerificationMutation(channel: AssistantChannelId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => assistantChannelsService.confirmVerification(channel, code),
    onSuccess: (link) => {
      setLink(queryClient, channel, link);
      toast.success("Número vinculado.");
    },
  });
}

export function useSwitchChannelWorkspaceMutation(channel: AssistantChannelId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      assistantChannelsService.switchWorkspace(channel, workspaceId),
    onSuccess: (link) => {
      setLink(queryClient, channel, link);
      toast.success("Workspace trocado. A conversa recomeça do zero.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUnlinkChannelMutation(channel: AssistantChannelId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => assistantChannelsService.unlink(channel),
    onSuccess: () => {
      setLink(queryClient, channel, null);
      toast.success("Número desvinculado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useChannelConversationsQuery(params: ListChannelConversationsParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.assistantChannels.conversations(params),
    queryFn: ({ pageParam }) =>
      assistantChannelsService.listConversations({
        ...params,
        limit: CONVERSATIONS_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

// Oldest first; "load more" fetches the next (newer) page.
export function useChannelMessagesQuery(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.assistantChannels.messages(conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      assistantChannelsService.listMessages(conversationId!, {
        limit: MESSAGES_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!conversationId,
  });
}
