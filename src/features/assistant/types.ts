// Local to this feature — the conversation is ephemeral (no persistence,
// stateless backend in v1, API.md § 16), so none of this belongs in
// src/types (which mirrors persisted API DTOs).

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
  // Only ever true for a `revoke_session` action targeting the caller's own
  // current session.
  isCurrentSession?: boolean;
}

export interface ExecutedAction {
  tool: string;
  result: unknown;
}

export interface AssistantChatResponse {
  reply: string;
  // Always empty in v1 (no write tool executes inside /assistant/chat) —
  // kept in the shape for contract stability, per API.md § 16.
  executedActions: ExecutedAction[];
  pendingActions: PendingAction[];
}

export interface ConfirmPendingActionResponse {
  tool: string;
  result: unknown;
}

export type PendingActionLocalStatus = "pending" | "confirmed" | "cancelled" | "expired";

export interface PendingActionState extends PendingAction {
  status: PendingActionLocalStatus;
}

export interface ChatTranscriptMessage {
  id: string;
  role: ChatRole;
  content: string;
  executedActions?: ExecutedAction[];
  pendingActions?: PendingActionState[];
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
