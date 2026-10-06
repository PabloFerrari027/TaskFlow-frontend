export const NOTIFICATION_TYPES = [
  "MENTION",
  "ITEM_ASSIGNED",
  "ITEM_COMMENTED",
  "ITEM_STATUS_CHANGED",
  "ITEM_DUE_SOON",
  "ITEM_OVERDUE",
  "ITEM_UNBLOCKED",
  "APPROVAL_REQUESTED",
  "APPROVAL_DECIDED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification {
  id: string;
  type: NotificationType;
  workspaceId: string;
  /** `null` for system notices (due date reminders). */
  actorId: string | null;
  entityType: "ITEM" | "COMMENT";
  entityId: string;
  itemId: string | null;
  folderId: string | null;
  /** Already in pt-BR, written by the server. */
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  workspaceId?: string;
}

export interface NotificationPreference {
  type: NotificationType;
  /** Shows up in the app's inbox. */
  inApp: boolean;
  /** Also sends an e-mail. */
  email: boolean;
  /** Also sends to the WhatsApp linked to the assistant (nothing without a link). */
  whatsapp: boolean;
}
