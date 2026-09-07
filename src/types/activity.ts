export type ActivityEntityType = "TASK" | "COMMENT";

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
