import { apiClient } from "@/lib/api/client";
import type { AiUsageQuery, AiUsageResponse } from "@/types/ai-usage";
import type {
  AssistantChatResponse,
  ChatMessage,
  ConfirmPendingActionResponse,
} from "@/features/assistant/types";

export const assistantService = {
  // `files` (attachments and/or audio) switch the request to multipart —
  // `history` then travels as a JSON string (form-data has no native
  // array/object) and `message` becomes optional, but only when at least one
  // attachment is audio (its transcription stands in as the message; API.md
  // § 16). The plain-JSON shape below is untouched for the no-attachment case.
  async sendChatMessage(
    message: string,
    workspaceId: string,
    history: ChatMessage[],
    files?: File[]
  ) {
    if (files && files.length > 0) {
      const formData = new FormData();
      if (message) formData.append("message", message);
      formData.append("workspaceId", workspaceId);
      formData.append("history", JSON.stringify(history));
      for (const file of files) formData.append("files", file);

      const { data } = await apiClient.post<AssistantChatResponse>(
        "/assistant/chat",
        formData
      );
      return data;
    }

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

  // Only the caller's own usage — there's no userId param (API.md § 24).
  async getMyAiUsage(params: AiUsageQuery) {
    const { data } = await apiClient.get<AiUsageResponse>("/ai-usage/me", { params });
    return data;
  },
};
