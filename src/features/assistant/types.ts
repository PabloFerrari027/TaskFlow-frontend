import type { AssistantConversationActionSummary } from "@/types/assistant-conversation";

// Local to this feature — the live chat turn shapes. The chat is stateless
// (the client resends `history` each turn, API.md § 16); the saved history
// DTOs live in src/types/assistant-conversation.ts.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type PendingActionRiskLevel = "standard" | "critical";

export interface PendingAction {
  id: string;
  tool: string;
  riskLevel: PendingActionRiskLevel;
  humanDescription: string;
  // Always shown to the user alongside `humanDescription` — the backend's
  // own documented mitigation for `reply` being persuasive-but-not-authoritative
  // text (API.md § 16, "Risco residual"). Never hide this.
  params: Record<string, unknown>;
  // Only for tools that change an existing field (update_*, assign_item,
  // move_item, change_item_status): one entry per field the action will
  // actually change, `from` read by the backend from the real current state.
  // Omitted (not `[]`) for create_* tools (API.md § 16).
  diff?: PendingActionFieldDiff[];
  // Only ever true for a `revoke_session` action targeting the caller's own
  // current session.
  isCurrentSession?: boolean;
}

export interface PendingActionFieldDiff {
  field: string;
  from: unknown;
  to: unknown;
}

export interface ExecutedAction {
  tool: string;
  result: unknown;
}

// One entry per audio attachment sent with the turn, in the order sent —
// `[]` when the turn had no audio (API.md § 16, "Anexos de áudio").
export interface Transcription {
  fileName: string;
  text: string;
}

export interface AssistantChatResponse {
  reply: string;
  // Always empty in v1 (no write tool executes inside /assistant/chat) —
  // kept in the shape for contract stability, per API.md § 16.
  executedActions: ExecutedAction[];
  pendingActions: PendingAction[];
  transcriptions: Transcription[];
  // Saved conversation this turn was recorded in — sent back as
  // `conversationId` on the next turn. `null` if saving failed.
  conversationId: string | null;
}

// What the assistant is doing right now, as reported by
// `POST /assistant/chat/stream` — the wording shown for each is ours
// (API.md § 16).
export type AssistantChatStage =
  | "transcribing"
  | "reading_attachments"
  | "loading_context"
  | "thinking"
  | "running_tool"
  | "checking_content";

export interface AssistantChatStatus {
  stage: AssistantChatStage;
  tool?: string;
}

// Every progress frame of the stream. The terminal `done`/`error` frames
// never reach callers as events: `done` resolves the call with its `result`
// and `error` rejects it.
export type AssistantChatEvent =
  | ({ type: "status" } & AssistantChatStatus)
  | { type: "transcription"; transcription: Transcription }
  | { type: "text_delta"; delta: string }
  | { type: "pending_action"; action: PendingAction }
  | { type: "warning"; message: string };

export interface ConfirmPendingActionResponse {
  tool: string;
  result: unknown;
}

export type PendingActionLocalStatus = "pending" | "confirmed" | "cancelled" | "expired";

export interface PendingActionState extends PendingAction {
  status: PendingActionLocalStatus;
}

// Display-only record of what was attached to a turn — the file/audio itself
// is never resent on later calls (API.md § 16: "Anexos de turnos anteriores
// nunca são reenviados"), only this filename note survives in `history`.
export interface ChatAttachment {
  fileName: string;
  isAudio: boolean;
}

export interface ChatTranscriptMessage {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: ChatAttachment[];
  executedActions?: ExecutedAction[];
  pendingActions?: PendingActionState[];
  // Only on messages restored from a saved conversation: what that turn
  // proposed. Display-only — the action can no longer be confirmed from here.
  pastActions?: AssistantConversationActionSummary[];
  // Present only on the assistant reply still being streamed (`null` until
  // the first status arrives) — `content` holds the text written so far and
  // is replaced by the final `reply` on `done`.
  streamingStatus?: AssistantChatStatus | null;
}

// One entry per PendingAction confirmed during the current session (Sheet
// open → close) — fuels the "N ações confirmadas" counter and the summary
// screen. Built entirely client-side from data already in hand; never a new
// backend call.
export interface ConfirmedActionSummary {
  tool: string;
  humanDescription: string;
  confirmedAt: string;
}
