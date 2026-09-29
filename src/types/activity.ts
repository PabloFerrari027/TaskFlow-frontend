export type ActivityEntityType = "TASK" | "COMMENT" | "SECTION" | "CUSTOM_FIELD";

export interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  /** Project where the change happened; null for workspace-level entries (workspace, automations, API keys…). */
  projectId: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  relatedTaskId: string | null;
  occurredAt: string;
}
