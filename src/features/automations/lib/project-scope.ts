import type { AutomationRule } from "@/types/automation";
import {
  findTriggerEvent,
  isInProjectEntity,
  payloadFieldsOf,
  type TriggerEventSpec,
} from "@/features/automations/lib/automation-catalog";
import { nextConditionKey, type RuleDraft } from "@/features/automations/lib/automation-draft";

/**
 * Rules belong to the workspace — there is no `projectId` on a rule. A rule is
 * tied to a project only through what it says: a "o projeto for X" condition,
 * a condition on one of the project's sections, or an action aimed at it. This
 * is how the project's "Automações" tab decides what to show, and how rules
 * created from there are limited to the project.
 */

const PROJECT_FIELD = "projectId";

export type ProjectRelation =
  // Names this project — "this project's automation".
  | "project"
  // Not limited to any project, so it also acts on this one.
  | "workspace";

interface ScopeCondition {
  field: string;
  operator: string;
  value: unknown;
}

function valuesOf(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).map(String);
}

function sectionFieldsOf(event: TriggerEventSpec | undefined) {
  return new Set(
    payloadFieldsOf(event)
      .filter((field) => field.kind === "section")
      .map((field) => field.field)
  );
}

/** Whether the condition can only match inside the given set of ids. */
function isPositive(condition: ScopeCondition) {
  return condition.operator === "equals" || condition.operator === "in";
}

export function projectRelation(
  rule: AutomationRule,
  projectId: string,
  projectSectionIds: ReadonlySet<string>
): ProjectRelation | null {
  const event = findTriggerEvent(rule.trigger.entityType, rule.trigger.eventType);
  const sectionFields = sectionFieldsOf(event);
  const conditions = rule.trigger.conditions;

  const projectConditions = conditions.filter((c) => c.field === PROJECT_FIELD);
  const sectionConditions = conditions.filter((c) => sectionFields.has(c.field));

  // "o projeto não for ESTE" — explicitly never runs here.
  if (
    projectConditions.some(
      (c) => c.operator === "notEquals" && valuesOf(c.value).includes(projectId)
    )
  ) {
    return null;
  }

  const namesProject =
    projectConditions.some((c) => isPositive(c) && valuesOf(c.value).includes(projectId)) ||
    sectionConditions.some(
      (c) => isPositive(c) && valuesOf(c.value).some((id) => projectSectionIds.has(id))
    ) ||
    rule.action.params[PROJECT_FIELD] === projectId ||
    projectSectionIds.has(String(rule.action.params.sectionId ?? ""));
  if (namesProject) return "project";

  // Limited to other projects (or their sections): nothing to do with this one.
  if ([...projectConditions, ...sectionConditions].some(isPositive)) return null;

  // An unlimited rule on something that happens inside projects also fires here.
  return isInProjectEntity(rule.trigger.entityType) ? "workspace" : null;
}

/**
 * Rules on project/workspace-level events (a member joining the workspace, a
 * project being archived…) — no longer offered by the builder and shown in no
 * project, so the project tab lists them separately to be paused or removed.
 */
export function isOutsideProjects(rule: AutomationRule) {
  return !isInProjectEntity(rule.trigger.entityType);
}

/** Whether the event can be limited to a project at all (it carries `projectId`). */
export function canLimitToProject(draft: RuleDraft) {
  const event = findTriggerEvent(draft.entityType, draft.eventType);
  return payloadFieldsOf(event).some((field) => field.field === PROJECT_FIELD);
}

export function isDraftLimitedToProject(draft: RuleDraft, projectId: string) {
  return draft.conditions.some(
    (c) => c.field === PROJECT_FIELD && isPositive(c) && valuesOf(c.value).includes(projectId)
  );
}

/**
 * Fills in "this project" where a draft leaves it open: adds the
 * "o projeto for X" condition (when the event supports one and the draft has
 * no project condition yet) and a blank "criar tarefa no projeto".
 */
export function scopeDraftToProject(draft: RuleDraft, projectId: string): RuleDraft {
  let next = draft;

  if (canLimitToProject(next) && !next.conditions.some((c) => c.field === PROJECT_FIELD)) {
    next = {
      ...next,
      conditions: [
        { key: nextConditionKey(), field: PROJECT_FIELD, operator: "equals", value: projectId },
        ...next.conditions,
      ],
    };
  }

  const target = next.params[PROJECT_FIELD];
  if (next.tool === "create_task" && target?.mode === "fixed" && target.value === "") {
    next = { ...next, params: { ...next.params, [PROJECT_FIELD]: { ...target, value: projectId } } };
  }

  return next;
}
