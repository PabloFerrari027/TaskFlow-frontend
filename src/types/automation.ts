import type { AnalyticsFilter } from "./analytics";

// Mirrors the backend's trigger whitelist (automation-trigger-whitelist.ts).
// Kept as `string` on the wire types below — the API rejects anything outside
// the whitelist itself, and a rule created elsewhere may use a value newer
// than this list.
export type AutomationEntityType =
  | "TASK"
  | "COMMENT"
  | "SECTION"
  | "PROJECT"
  | "CUSTOM_FIELD"
  | "WORKSPACE";

export interface AutomationTrigger {
  entityType: string;
  eventType: string;
  // Same shape/operators as analytics filters; all must match (AND). Empty
  // means "always fires".
  conditions: AnalyticsFilter[];
}

export interface AutomationAction {
  tool: string;
  // Fixed values, or a `{{payload.FIELD}}` placeholder the backend resolves
  // against the triggering event at execution time.
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  // The authority the action runs with — revalidated on every firing.
  createdBy: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRuleRequest {
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
}

// `trigger`/`action` replace the whole object and are validated together.
export interface UpdateAutomationRuleRequest {
  name?: string;
  trigger?: AutomationTrigger;
  action?: AutomationAction;
  enabled?: boolean;
}
