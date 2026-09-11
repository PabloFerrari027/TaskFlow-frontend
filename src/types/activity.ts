export type ActivityEntityType = "TASK" | "COMMENT" | "SECTION" | "CUSTOM_FIELD";

export interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  entityType: ActivityEntityType;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  relatedTaskId: string | null;
  occurredAt: string;
}
