import { apiClient } from "@/lib/api/client";
import type {
  AssistantChatResponse,
  ChatMessage,
  ConfirmPendingActionResponse,
} from "@/features/assistant/types";

export const assistantService = {
  async sendChatMessage(message: string, workspaceId: string, history: ChatMessage[]) {
    const { data } = await apiClient.post<AssistantChatResponse>("/assistant/chat", {
      message,
      workspaceId,
      history,
    });
    return data;
  },

  // Password or Google ID token reauth — never send twoFactorCode (not
  // supported yet, API.md § 16).
  async confirmPendingAction(
    actionId: string,
    reauth?: { password: string } | { googleIdToken: string }
  ) {
    const { data } = await apiClient.post<ConfirmPendingActionResponse>(
      `/assistant/actions/${actionId}/confirm`,
      reauth ? { reauth } : {}
    );
    return data;
  },

  async cancelPendingAction(actionId: string) {
    const { data } = await apiClient.post<{ cancelled: true }>(
      `/assistant/actions/${actionId}/cancel`
    );
    return data;
  },
};
