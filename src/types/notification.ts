export const NOTIFICATION_TYPES = [
  "MENTION",
  "TASK_ASSIGNED",
  "TASK_COMMENTED",
  "TASK_STATUS_CHANGED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "TASK_UNBLOCKED",
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
  entityType: "TASK" | "COMMENT";
  entityId: string;
  taskId: string | null;
  projectId: string | null;
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
