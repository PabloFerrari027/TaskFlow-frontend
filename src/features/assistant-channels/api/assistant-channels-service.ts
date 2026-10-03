import { apiClient } from "@/lib/api/client";
import type {
  AssistantChannel,
  AssistantChannelId,
  AssistantChannelLink,
  ChannelConversation,
  ChannelMessage,
  ChannelVerificationStarted,
  CursorPage,
  ListChannelConversationsParams,
  StartChannelVerificationRequest,
} from "@/types/assistant-channel";

// API.md § 28. The webhooks under `/assistant-channels/<canal>/webhook` are
// for the channel provider only and never called from here.
export const assistantChannelsService = {
  async list() {
    const { data } = await apiClient.get<AssistantChannel[]>("/assistant-channels");
    return data;
  },

  // Sends a 6-digit code TO the address, over the channel itself.
  async startVerification(channel: AssistantChannelId, payload: StartChannelVerificationRequest) {
    const { data } = await apiClient.post<ChannelVerificationStarted>(
      `/assistant-channels/${channel}/verification`,
      payload
    );
    return data;
  },

  async confirmVerification(channel: AssistantChannelId, code: string) {
    const { data } = await apiClient.post<AssistantChannelLink>(
      `/assistant-channels/${channel}/verification/confirm`,
      { code }
    );
    return data;
  },

  // The conversation starts over; the previous one stays in the history.
  async switchWorkspace(channel: AssistantChannelId, workspaceId: string) {
    const { data } = await apiClient.patch<AssistantChannelLink>(
      `/assistant-channels/${channel}/link`,
      { workspaceId }
    );
    return data;
  },

  async unlink(channel: AssistantChannelId) {
    await apiClient.delete(`/assistant-channels/${channel}/link`);
  },

  async listConversations(params: ListChannelConversationsParams & { cursor?: string }) {
    const { data } = await apiClient.get<CursorPage<ChannelConversation>>(
      "/assistant-channels/conversations",
      { params }
    );
    return data;
  },

  async listMessages(conversationId: string, params: { cursor?: string; limit?: number }) {
    const { data } = await apiClient.get<CursorPage<ChannelMessage>>(
      `/assistant-channels/conversations/${conversationId}/messages`,
      { params }
    );
    return data;
  },
};
