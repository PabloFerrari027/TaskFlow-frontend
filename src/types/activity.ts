export type ActivityEntityType = "ITEM" | "COMMENT" | "SECTION" | "CUSTOM_FIELD";

export interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  /** Folder where the change happened; null for workspace-level entries (workspace, automations, API keys…). */
  folderId: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  relatedItemId: string | null;
  occurredAt: string;
}
