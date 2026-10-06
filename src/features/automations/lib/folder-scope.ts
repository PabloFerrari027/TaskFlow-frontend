import type { AutomationRule } from "@/types/automation";
import {
  findTriggerEvent,
  isInFolderEntity,
  payloadFieldsOf,
  type TriggerEventSpec,
} from "@/features/automations/lib/automation-catalog";
import { nextConditionKey, type RuleDraft } from "@/features/automations/lib/automation-draft";

/**
 * Rules belong to the workspace — there is no `folderId` on a rule. A rule is
 * tied to a folder only through what it says: a "a pasta for X" condition,
 * a condition on one of the folder's sections, or an action aimed at it. This
 * is how the folder's "Automações" tab decides what to show, and how rules
 * created from there are limited to the folder.
 */

const FOLDER_FIELD = "folderId";

export type FolderRelation =
  // Names this folder — "this folder's automation".
  | "folder"
  // Not limited to any folder, so it also acts on this one.
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

export function folderRelation(
  rule: AutomationRule,
  folderId: string,
  folderSectionIds: ReadonlySet<string>
): FolderRelation | null {
  const event = findTriggerEvent(rule.trigger.entityType, rule.trigger.eventType);
  const sectionFields = sectionFieldsOf(event);
  const conditions = rule.trigger.conditions;

  const folderConditions = conditions.filter((c) => c.field === FOLDER_FIELD);
  const sectionConditions = conditions.filter((c) => sectionFields.has(c.field));

  // "a pasta não for ESTE" — explicitly never runs here.
  if (
    folderConditions.some(
      (c) => c.operator === "notEquals" && valuesOf(c.value).includes(folderId)
    )
  ) {
    return null;
  }

  const namesFolder =
    folderConditions.some((c) => isPositive(c) && valuesOf(c.value).includes(folderId)) ||
    sectionConditions.some(
      (c) => isPositive(c) && valuesOf(c.value).some((id) => folderSectionIds.has(id))
    ) ||
    rule.action.params[FOLDER_FIELD] === folderId ||
    folderSectionIds.has(String(rule.action.params.sectionId ?? ""));
  if (namesFolder) return "folder";

  // Limited to other folders (or their sections): nothing to do with this one.
  if ([...folderConditions, ...sectionConditions].some(isPositive)) return null;

  // An unlimited rule on something that happens inside folders also fires here.
  return isInFolderEntity(rule.trigger.entityType) ? "workspace" : null;
}

/**
 * Rules on folder/workspace-level events (a member joining the workspace, a
 * folder being archived…) — no longer offered by the builder and shown in no
 * folder, so the folder tab lists them separately to be paused or removed.
 */
export function isOutsideFolders(rule: AutomationRule) {
  return !isInFolderEntity(rule.trigger.entityType);
}

/** Whether the event can be limited to a folder at all (it carries `folderId`). */
export function canLimitToFolder(draft: RuleDraft) {
  const event = findTriggerEvent(draft.entityType, draft.eventType);
  return payloadFieldsOf(event).some((field) => field.field === FOLDER_FIELD);
}

export function isDraftLimitedToFolder(draft: RuleDraft, folderId: string) {
  return draft.conditions.some(
    (c) => c.field === FOLDER_FIELD && isPositive(c) && valuesOf(c.value).includes(folderId)
  );
}

/**
 * Fills in "this folder" where a draft leaves it open: adds the
 * "a pasta for X" condition (when the event supports one and the draft has
 * no folder condition yet) and a blank "criar item na pasta".
 */
export function scopeDraftToFolder(draft: RuleDraft, folderId: string): RuleDraft {
  let next = draft;

  if (canLimitToFolder(next) && !next.conditions.some((c) => c.field === FOLDER_FIELD)) {
    next = {
      ...next,
      conditions: [
        { key: nextConditionKey(), field: FOLDER_FIELD, operator: "equals", value: folderId },
        ...next.conditions,
      ],
    };
  }

  const target = next.params[FOLDER_FIELD];
  if (next.tool === "create_item" && target?.mode === "fixed" && target.value === "") {
    next = { ...next, params: { ...next.params, [FOLDER_FIELD]: { ...target, value: folderId } } };
  }

  return next;
}
