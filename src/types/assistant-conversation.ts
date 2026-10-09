// History of the in-app assistant chat (API.md § 16, "Histórico de conversas").
// The chat itself stays stateless — the client still resends `history` on
// every turn; this is only the saved record used to list and resume.
import type { CursorPage } from "@/types/assistant-channel";

export interface AssistantConversation {
  id: string;
  workspaceId: string;
  /** The user's first message, cut at 120 characters. */
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
}

// What a past turn proposed or did — a summary only: whether a proposed
// action was later confirmed or cancelled is not saved.
export interface AssistantConversationActionSummary {
  tool: string;
  riskLevel?: "standard" | "critical";
  humanDescription?: string;
}

export interface AssistantConversationMessageMetadata {
  // User messages: names only — the files themselves are never kept.
  attachments?: string[];
  transcriptions?: { fileName: string; text: string }[];
  // Assistant messages.
  pendingActions?: AssistantConversationActionSummary[];
  executedActions?: AssistantConversationActionSummary[];
}

export interface AssistantConversationMessage {
  id: string;
  role: "user" | "assistant";
  /** Markdown. */
  content: string;
  metadata: AssistantConversationMessageMetadata | null;
  createdAt: string;
}

export interface ListAssistantConversationsParams {
  workspaceId?: string;
}

export type AssistantConversationPage = CursorPage<AssistantConversation>;
export type AssistantConversationMessagePage = CursorPage<AssistantConversationMessage>;
