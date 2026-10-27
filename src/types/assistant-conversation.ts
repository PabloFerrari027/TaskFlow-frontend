// The user's single in-app chat with the assistant (API.md § 16, "O chat da
// pessoa"). The server keeps the whole history and feeds the model only its
// latest messages — the client never resends `history`.
import type { CursorPage } from "@/types/assistant-channel";

// What a past turn proposed or did. A proposed action comes back with its
// status read on the spot (absent: nobody knows anymore); one still waiting
// for this session also brings `params`/`diff` and can be confirmed.
export interface AssistantConversationActionSummary {
  id?: string;
  tool: string;
  riskLevel?: "standard" | "critical";
  humanDescription?: string;
  expiresAt?: string;
  status?: "pending" | "confirmed" | "cancelled" | "expired";
  params?: Record<string, unknown>;
  diff?: { field: string; from: unknown; to: unknown }[];
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
  /** Workspace that was open when the message was exchanged. */
  workspaceId: string;
  /** Markdown. */
  content: string;
  metadata: AssistantConversationMessageMetadata | null;
  createdAt: string;
}

// Newest page first; each page is in chronological order and `nextCursor`
// goes further back in time.
export type AssistantConversationMessagePage = CursorPage<AssistantConversationMessage>;

export type AssistantOnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";

// What the assistant knows about the user — a summary it writes itself from
// what they told it (API.md § 16). Goes into every conversation, app and
// WhatsApp alike.
export interface AssistantProfile {
  summary: string | null;
  onboarding: AssistantOnboardingStatus;
  updatedAt: string | null;
}
