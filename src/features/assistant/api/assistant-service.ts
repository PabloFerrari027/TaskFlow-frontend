import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import {
  apiClient,
  attemptSessionRefresh,
  redirectToLogin,
} from "@/lib/api/client";
import { getAccessToken, getRefreshCredentials } from "@/lib/auth/token-store";
import type { AiUsageQuery, AiUsageResponse } from "@/types/ai-usage";
import type {
  AssistantConversationMessagePage,
  AssistantConversationPage,
  ListAssistantConversationsParams,
} from "@/types/assistant-conversation";
import type {
  AssistantChatEvent,
  AssistantChatResponse,
  ChatMessage,
  ConfirmPendingActionResponse,
} from "@/features/assistant/types";

type StreamFrame =
  | AssistantChatEvent
  | { type: "done"; result: AssistantChatResponse }
  | { type: "error"; statusCode: number; code: string; message: string };

// The stream is read with `fetch` (axios can't hand over a readable body in
// the browser), so its failures are rebuilt as AxiosErrors carrying the same
// `{ statusCode, code, message }` body — `getErrorCode`/`getErrorMessage`
// and every existing `code === ...` branch keep working unchanged.
function toAxiosError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = { data, status, statusText: "", headers: {}, config };
  return new AxiosError(`Request failed with status code ${status}`, undefined, config, null, response);
}

function buildChatBody(
  message: string,
  workspaceId: string,
  history: ChatMessage[],
  conversationId: string | null,
  files?: File[]
): { body: BodyInit; contentType?: string } {
  // `files` (attachments and/or audio) switch the request to multipart —
  // `history` then travels as a JSON string (form-data has no native
  // array/object) and `message` becomes optional, but only when at least one
  // attachment is audio (its transcription stands in as the message; API.md
  // § 16). The plain-JSON shape is untouched for the no-attachment case.
  if (files && files.length > 0) {
    const formData = new FormData();
    if (message) formData.append("message", message);
    formData.append("workspaceId", workspaceId);
    formData.append("history", JSON.stringify(history));
    if (conversationId) formData.append("conversationId", conversationId);
    for (const file of files) formData.append("files", file);
    return { body: formData };
  }
  return {
    body: JSON.stringify({ message, workspaceId, history, conversationId: conversationId ?? undefined }),
    contentType: "application/json",
  };
}

export const assistantService = {
  /**
   * `POST /assistant/chat/stream` — same body and admission errors as
   * `POST /assistant/chat`, but answered as SSE so the user sees what the
   * assistant is doing and the reply being written (API.md § 16). Admission
   * refusals (disabled, rate limit, quota, attachments, 400) are still plain
   * HTTP errors before any frame; after that a failure arrives as a final
   * `error` frame. Progress frames go to `onEvent`; the returned promise
   * resolves with `done.result`, the authoritative reply. Aborting `signal`
   * closes the connection, which also stops the model server-side.
   * `conversationId` continues a saved conversation (`null` starts one);
   * `done.result.conversationId` is the one to send on the next turn.
   */
  async streamChatMessage(
    message: string,
    workspaceId: string,
    history: ChatMessage[],
    conversationId: string | null,
    files: File[] | undefined,
    { onEvent, signal }: { onEvent: (event: AssistantChatEvent) => void; signal?: AbortSignal }
  ): Promise<AssistantChatResponse> {
    const url = `${apiClient.defaults.baseURL}/assistant/chat/stream`;

    // Rebuilt per attempt — a FormData/string body can be resent, but not
    // after being handed to a request that's already been read.
    const send = (token: string | null) => {
      const { body, contentType } = buildChatBody(message, workspaceId, history, conversationId, files);
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (contentType) headers["Content-Type"] = contentType;
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(url, { method: "POST", headers, body, signal });
    };

    let response = await send(getAccessToken());
    // Same one-shot refresh the axios interceptor does for every other call.
    if (response.status === 401) {
      const refreshed = await attemptSessionRefresh();
      if (refreshed) response = await send(refreshed);
      // No credentials left = the session really ended; otherwise the API was
      // just unreachable and the 401 below surfaces as a normal error.
      else if (!getRefreshCredentials()) redirectToLogin();
    }

    if (!response.ok || !response.body) {
      const data: unknown = await response.json().catch(() => null);
      throw toAxiosError(response.status, data);
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;

        // Frames are separated by a blank line; the last piece may be a
        // frame still being received, so it stays in the buffer.
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          // `:ping` keep-alives (and any other comment line) carry no data.
          const data = frame
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n");
          if (!data) continue;

          const event = JSON.parse(data) as StreamFrame;
          if (event.type === "done") return event.result;
          if (event.type === "error") {
            throw toAxiosError(event.statusCode, {
              statusCode: event.statusCode,
              code: event.code,
              message: event.message,
            });
          }
          onEvent(event);
        }
      }
    } finally {
      // Closes the connection if we stopped early (error frame, bad JSON);
      // a no-op once the server has already ended the stream.
      reader.cancel().catch(() => {});
    }

    // The connection closed without `done`/`error` — treated as a dropped
    // connection, same as axios reports one (no `response`).
    throw new AxiosError("Assistant stream ended unexpectedly", AxiosError.ERR_NETWORK);
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

  // Saved in-app conversations — always the caller's own (API.md § 16).
  async listConversations(params: ListAssistantConversationsParams & { cursor?: string; limit?: number }) {
    const { data } = await apiClient.get<AssistantConversationPage>("/assistant/conversations", {
      params,
    });
    return data;
  },

  async listConversationMessages(conversationId: string, params: { cursor?: string; limit?: number }) {
    const { data } = await apiClient.get<AssistantConversationMessagePage>(
      `/assistant/conversations/${conversationId}/messages`,
      { params }
    );
    return data;
  },

  async deleteConversation(conversationId: string) {
    await apiClient.delete(`/assistant/conversations/${conversationId}`);
  },

  // Only the caller's own usage — there's no userId param (API.md § 24).
  async getMyAiUsage(params: AiUsageQuery) {
    const { data } = await apiClient.get<AiUsageResponse>("/ai-usage/me", { params });
    return data;
  },
};
