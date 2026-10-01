export interface RealtimeTicket {
  ticket: string;
  expiresInSeconds: number;
}

// Sent once, as the first frame of every new connection.
export interface RealtimeSyncMessage {
  type: "sync";
}

// An invalidation signal — never the entity's data.
export interface RealtimeChangeMessage {
  type: "change";
  entityType: string;
  entityId: string;
  eventType: string;
  workspaceId: string;
  occurredAt: string;
}

// "A notification arrived for YOU" — only sent to the recipient's connections.
// Like `change`, it carries no content: the inbox is fetched from /notifications.
export interface RealtimeNotificationMessage {
  type: "notification";
  notificationId: string;
  notificationType: string;
  workspaceId: string;
  occurredAt: string;
}

export type RealtimeMessage =
  | RealtimeSyncMessage
  | RealtimeChangeMessage
  | RealtimeNotificationMessage;
