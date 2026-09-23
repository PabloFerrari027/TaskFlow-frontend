// Mirrors the backend's "Plataforma de API" whitelist (API.md § 22) — there
// is no endpoint that lists these, so they must be kept in sync by hand.

export type ApiKeyEnvironment = "LIVE" | "TEST";

export type ApiKeyScope =
  | "tasks:read"
  | "tasks:write"
  | "projects:read"
  | "projects:write"
  | "workspace:read"
  | "webhooks:manage";

export interface ApiKeyDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  environment: ApiKeyEnvironment;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Present only in the create/rotate response, and only that one time — the
  // full secret is never returned again.
  plainKey?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  scopes: ApiKeyScope[];
  environment?: ApiKeyEnvironment;
  expiresAt?: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: ApiKeyScope[];
  expiresAt?: string;
}

// Same closed whitelist as the automations/activity event identifiers
// (API.md § 14/21/22).
export const WEBHOOK_EVENTS = [
  "tasks.task_status_changed",
  "tasks.task_assigned",
  "tasks.task_moved",
  "tasks.task_parent_changed",
  "tasks.task_due_date_changed",
  "tasks.task_priority_changed",
  "tasks.task_participant_added",
  "tasks.task_participant_removed",
  "custom_fields.task_custom_field_value_set",
  "comments.comment_created",
  "sections.section_created",
  "sections.section_moved",
  "sections.section_parent_changed",
  "projects.project_created",
  "projects.project_updated",
  "projects.project_archived",
  "projects.project_parent_changed",
  "projects.member_removed",
  "custom_fields.custom_field_created",
  "custom_fields.custom_field_options_updated",
  "custom_fields.custom_field_archived",
  "workspaces.workspace_renamed",
  "workspaces.member_added",
  "workspaces.member_removed",
  "workspaces.member_role_changed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEndpointDto {
  id: string;
  workspaceId: string;
  url: string;
  description: string | null;
  events: string[];
  active: boolean;
  consecutiveFailureCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Present only in the create/rotate-secret response, and only that one
  // time — the full secret is never returned again.
  plainSigningSecret?: string;
}

export interface CreateWebhookEndpointRequest {
  url: string;
  description?: string;
  events: string[];
}

export interface UpdateWebhookEndpointRequest {
  url?: string;
  description?: string;
  events?: string[];
  active?: boolean;
}

export type WebhookDeliveryStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface WebhookDeliveryDto {
  id: string;
  webhookEndpointId: string;
  eventName: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  lastResponseStatus: number | null;
  lastError: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}
