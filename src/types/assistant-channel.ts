// The assistant over messaging channels (API.md § 28). Today only WhatsApp;
// every endpoint takes the channel id, so a new one needs no new types.
export type AssistantChannelId = "whatsapp";

export interface AssistantChannelLink {
  /** The id the channel itself uses — may differ from the number typed in. */
  externalId: string;
  workspaceId: string;
  linkedAt: string;
  lastMessageAt: string | null;
}

export interface AssistantChannel {
  channel: AssistantChannelId;
  /** `false` when the server has no credentials for it — hide it. */
  available: boolean;
  /** TaskFlow's own contact on the channel (on WhatsApp, the number). */
  contact: string | null;
  link: AssistantChannelLink | null;
}

export interface ChannelVerificationStarted {
  /** Normalized address the code went to. */
  address: string;
  expiresAt: string;
}

export interface StartChannelVerificationRequest {
  address: string;
  workspaceId: string;
}

export type ChannelConversationEndReason =
  | "new_command"
  | "workspace_switch"
  | "unlinked"
  | "relinked"
  | "idle";

export interface ChannelConversation {
  id: string;
  channel: AssistantChannelId;
  workspaceId: string;
  startedAt: string;
  lastMessageAt: string;
  /** `null` while open (at most one per channel). */
  endedAt: string | null;
  endReason: ChannelConversationEndReason | null;
  messageCount: number;
  /** The user's first message, cut at 120 characters. */
  preview: string | null;
}

export type ChannelMessageKind =
  | "message"
  | "quick_reply"
  | "unsupported"
  | "reply"
  | "action_prompt"
  | "notice";

export interface ChannelMessageMetadata {
  // The file itself is never kept; audio shows up as its transcript.
  attachment?: { mediaType: string; mimeType: string | null; fileName: string | null };
  actionId?: string;
  riskLevel?: string;
  deliveryFailed?: boolean;
}

export interface ChannelMessage {
  id: string;
  role: "user" | "assistant";
  kind: ChannelMessageKind;
  /** Markdown. */
  content: string;
  metadata: ChannelMessageMetadata | null;
  createdAt: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ListChannelConversationsParams {
  workspaceId?: string;
  channel?: AssistantChannelId;
  limit?: number;
}
