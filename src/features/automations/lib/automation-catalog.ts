import type { AnalyticsOperator } from "@/types/analytics";
import type { AutomationEntityType } from "@/types/automation";

/**
 * Frontend copy of the backend whitelists (automation-trigger-whitelist.ts and
 * the `automatable` actions in action-registry.ts) — there is no endpoint that
 * lists them, so this must be updated by hand when the backend adds an event
 * or action. The backend validates every rule on save, so a stale entry here
 * fails loudly (INVALID_AUTOMATION_*), never silently.
 *
 * Wording note: event phrases follow "Quando [um item] [tiver o status
 * alterado]…" — second-person/conditional, not the past tense that
 * `describeActivityEntry` uses for the (already happened) activity feed.
 */

export type FieldKind =
  | "member"
  | "folder"
  | "section"
  | "itemStatus"
  // A folder's workflow status (etapa): the value is `CATEGORY` (the
  // category's default) or `CATEGORY:statusId` — sent as `status` + `statusId`.
  | "workflowStatus"
  | "itemPriority"
  | "folderStatus"
  | "approvalDecision"
  | "number"
  | "date"
  | "text";

export interface PayloadFieldSpec {
  field: string;
  label: string;
  article: "o" | "a";
  kind: FieldKind;
}

export interface TriggerEventSpec {
  entityType: AutomationEntityType;
  eventType: string;
  phrase: string;
  // Payload fields beyond the common `actorId` (see ACTOR_FIELD).
  fields: PayloadFieldSpec[];
  // Which payload field holds the id of the affected item, when the event has
  // one — what lets an item action target "the item this happened to".
  itemIdField: "entityId" | "itemId" | null;
}

export const ENTITY_LABEL: Record<AutomationEntityType, string> = {
  ITEM: "um item",
  COMMENT: "um comentário",
  SECTION: "uma seção",
  FOLDER: "uma pasta",
  CUSTOM_FIELD: "um campo personalizado",
  WORKSPACE: "o workspace",
};

// What the builder offers: things that happen *inside* a folder, since
// automations are only managed from a folder's tab. FOLDER and WORKSPACE
// events stay in TRIGGER_EVENTS so older rules on them can still be read.
export const ENTITY_TYPES: AutomationEntityType[] = ["ITEM", "COMMENT", "SECTION", "CUSTOM_FIELD"];

export function isInFolderEntity(entityType: string) {
  return (ENTITY_TYPES as string[]).includes(entityType);
}

// Carried by every event; usable both as a condition and as an event value
// ("quem fez a alteração").
export const ACTOR_FIELD: PayloadFieldSpec = {
  field: "actorId",
  label: "autor da ação",
  article: "o",
  kind: "member",
};

const f = (
  field: string,
  label: string,
  article: "o" | "a",
  kind: FieldKind
): PayloadFieldSpec => ({ field, label, article, kind });

const FOLDER_ID = f("folderId", "pasta", "o", "folder");

export const TRIGGER_EVENTS: TriggerEventSpec[] = [
  // ---------------------------------------------------------------- ITEM
  {
    entityType: "ITEM",
    eventType: "items.item_created",
    phrase: "for criada",
    fields: [FOLDER_ID, f("sectionId", "seção", "a", "section")],
    itemIdField: "entityId",
  },
  // Time-based (no author): sent once per due date by the server's deadline scanner.
  {
    entityType: "ITEM",
    eventType: "items.item_due_soon",
    phrase: "estiver com o prazo chegando",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_overdue",
    phrase: "passar do prazo",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_status_changed",
    phrase: "tiver o status alterado",
    fields: [
      FOLDER_ID,
      f("fromStatus", "status anterior", "o", "itemStatus"),
      f("toStatus", "novo status", "o", "itemStatus"),
    ],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_assigned",
    phrase: "tiver o responsável alterado",
    fields: [
      FOLDER_ID,
      f("assigneeId", "novo responsável", "o", "member"),
      f("previousAssigneeId", "responsável anterior", "o", "member"),
    ],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_moved",
    phrase: "mudar de seção",
    fields: [
      FOLDER_ID,
      f("fromSectionId", "seção de origem", "a", "section"),
      f("toSectionId", "seção de destino", "a", "section"),
    ],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_parent_changed",
    phrase: "virar subitem de outro item",
    fields: [
      FOLDER_ID,
      f("fromParentId", "item principal anterior", "a", "text"),
      f("toParentId", "novo item principal", "a", "text"),
    ],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_due_date_changed",
    phrase: "tiver o prazo alterado",
    fields: [FOLDER_ID, f("dueDate", "novo prazo", "o", "date")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_priority_changed",
    phrase: "tiver a prioridade alterada",
    fields: [FOLDER_ID, f("priority", "nova prioridade", "a", "itemPriority")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_participant_added",
    phrase: "ganhar um participante",
    fields: [f("userId", "participante", "o", "member")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_participant_removed",
    phrase: "perder um participante",
    fields: [f("userId", "participante", "o", "member")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_workflow_status_changed",
    phrase: "mudar de etapa",
    fields: [FOLDER_ID, f("category", "tipo da nova etapa", "o", "itemStatus")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_assignees_changed",
    phrase: "tiver os responsáveis alterados",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_schedule_changed",
    phrase: "tiver o início ou o marco alterado",
    fields: [FOLDER_ID, f("startDate", "novo início", "o", "date")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_estimate_changed",
    phrase: "tiver a estimativa alterada",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_dependency_added",
    phrase: "passar a depender de outro item",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_dependency_removed",
    phrase: "deixar de depender de outro item",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "items.item_restored",
    phrase: "for restaurada da lixeira",
    fields: [FOLDER_ID],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "approvals.approval_requested",
    phrase: "tiver uma aprovação pedida",
    fields: [FOLDER_ID, f("approverId", "quem vai aprovar", "o", "member")],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "approvals.approval_decided",
    phrase: "tiver uma aprovação respondida",
    fields: [
      FOLDER_ID,
      f("decision", "resposta", "a", "approvalDecision"),
      f("approverId", "quem respondeu", "o", "member"),
    ],
    itemIdField: "entityId",
  },
  {
    entityType: "ITEM",
    eventType: "custom_fields.item_custom_field_value_set",
    phrase: "tiver um campo personalizado alterado",
    fields: [
      FOLDER_ID,
      f("definitionId", "campo personalizado", "o", "text"),
      f("previousValue", "valor anterior", "o", "text"),
      f("newValue", "novo valor", "o", "text"),
    ],
    itemIdField: "entityId",
  },
  // ------------------------------------------------------------- COMMENT
  {
    entityType: "COMMENT",
    eventType: "comments.comment_created",
    phrase: "for criado",
    fields: [
      f("itemId", "item", "a", "text"),
      f("authorId", "autor do comentário", "o", "member"),
      f("parentId", "comentário respondido", "o", "text"),
    ],
    itemIdField: "itemId",
  },
  {
    entityType: "COMMENT",
    eventType: "comments.comment_edited",
    phrase: "for editado",
    fields: [f("itemId", "item", "a", "text")],
    itemIdField: "itemId",
  },
  // ------------------------------------------------------------- SECTION
  {
    entityType: "SECTION",
    eventType: "sections.section_created",
    phrase: "for criada",
    fields: [FOLDER_ID, f("name", "nome", "o", "text")],
    itemIdField: null,
  },
  {
    entityType: "SECTION",
    eventType: "sections.section_moved",
    phrase: "mudar de posição",
    fields: [
      FOLDER_ID,
      f("fromPosition", "posição anterior", "a", "number"),
      f("toPosition", "nova posição", "a", "number"),
    ],
    itemIdField: null,
  },
  {
    entityType: "SECTION",
    eventType: "sections.section_parent_changed",
    phrase: "virar subseção de outra seção",
    fields: [
      FOLDER_ID,
      f("fromParentId", "seção principal anterior", "a", "section"),
      f("toParentId", "nova seção principal", "a", "section"),
    ],
    itemIdField: null,
  },
  // ------------------------------------------------------------- FOLDER
  {
    entityType: "FOLDER",
    eventType: "folders.folder_created",
    phrase: "for criado",
    fields: [],
    itemIdField: null,
  },
  {
    entityType: "FOLDER",
    eventType: "folders.folder_updated",
    phrase: "for editado",
    fields: [f("name", "nome", "o", "text"), f("description", "descrição", "a", "text")],
    itemIdField: null,
  },
  {
    entityType: "FOLDER",
    eventType: "folders.folder_archived",
    phrase: "for arquivado",
    fields: [],
    itemIdField: null,
  },
  {
    entityType: "FOLDER",
    eventType: "folders.folder_parent_changed",
    phrase: "virar subpasta de outra pasta",
    fields: [
      f("fromParentId", "pasta principal anterior", "o", "folder"),
      f("toParentId", "nova pasta principal", "o", "folder"),
    ],
    itemIdField: null,
  },
  {
    entityType: "FOLDER",
    eventType: "folders.member_removed",
    phrase: "perder um membro",
    fields: [f("userId", "membro removido", "o", "member")],
    itemIdField: null,
  },
  // --------------------------------------------------------- CUSTOM_FIELD
  {
    entityType: "CUSTOM_FIELD",
    eventType: "custom_fields.custom_field_created",
    phrase: "for criado",
    fields: [FOLDER_ID, f("name", "nome", "o", "text"), f("type", "tipo", "o", "text")],
    itemIdField: null,
  },
  {
    entityType: "CUSTOM_FIELD",
    eventType: "custom_fields.custom_field_options_updated",
    phrase: "tiver as opções alteradas",
    fields: [FOLDER_ID],
    itemIdField: null,
  },
  {
    entityType: "CUSTOM_FIELD",
    eventType: "custom_fields.custom_field_archived",
    phrase: "for arquivado",
    fields: [FOLDER_ID],
    itemIdField: null,
  },
  // ----------------------------------------------------------- WORKSPACE
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.workspace_created",
    phrase: "for criado",
    fields: [f("name", "nome", "o", "text")],
    itemIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.workspace_renamed",
    phrase: "for renomeado",
    fields: [f("previousName", "nome anterior", "o", "text"), f("name", "novo nome", "o", "text")],
    itemIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.workspace_deleted",
    phrase: "for excluído",
    fields: [],
    itemIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.member_added",
    phrase: "ganhar um membro",
    fields: [f("userId", "novo membro", "o", "member"), f("role", "papel", "o", "text")],
    itemIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.member_removed",
    phrase: "perder um membro",
    fields: [f("userId", "membro removido", "o", "member")],
    itemIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.member_role_changed",
    phrase: "ter o papel de um membro alterado",
    fields: [
      f("userId", "membro", "o", "member"),
      f("fromRole", "papel anterior", "o", "text"),
      f("toRole", "novo papel", "o", "text"),
    ],
    itemIdField: null,
  },
];

export function findTriggerEvent(entityType: string, eventType: string) {
  return TRIGGER_EVENTS.find(
    (event) => event.entityType === entityType && event.eventType === eventType
  );
}

export function eventsOfEntity(entityType: string) {
  return TRIGGER_EVENTS.filter((event) => event.entityType === entityType);
}

/** Fields a condition can filter on / an action value can reference for this event. */
export function payloadFieldsOf(event: TriggerEventSpec | undefined): PayloadFieldSpec[] {
  return event ? [...event.fields, ACTOR_FIELD] : [];
}

// ---------------------------------------------------------------- operators

export const OPERATOR_LABEL: Record<AnalyticsOperator, string> = {
  equals: "for",
  notEquals: "não for",
  in: "for um destes:",
  greaterThan: "for maior que",
  lessThan: "for menor que",
  between: "estiver entre",
};

// What the picker offers. The other operators (greaterThan/lessThan/between)
// exist in the API and are round-tripped when a rule already uses one, but
// nothing in the current whitelist makes them useful enough to advertise.
export const COMMON_OPERATORS: AnalyticsOperator[] = ["equals", "notEquals", "in"];

// ------------------------------------------------------------------ actions

export interface ActionParamSpec {
  key: string;
  label: string;
  // Text read between the previous chip and this one: "… para a seção [x]".
  lead: string;
  kind: FieldKind;
  // Left out of the request when empty, and not required to save.
  optional?: boolean;
}

export interface ActionSpec {
  tool: string;
  // The verb phrase shown in the tool chip.
  label: string;
  // Needs "the item this happened to" — only offered for events that carry one.
  needsItem: boolean;
  // Only the params the sentence builder edits; anything else a rule already
  // carries (e.g. move_item's `position`) is preserved untouched on save.
  params: ActionParamSpec[];
}

export const ACTIONS: ActionSpec[] = [
  {
    tool: "move_item",
    label: "mover o item",
    needsItem: true,
    params: [{ key: "sectionId", label: "seção", lead: "para a seção", kind: "section" }],
  },
  {
    tool: "change_item_status",
    label: "mudar o status do item",
    needsItem: true,
    params: [{ key: "status", label: "etapa", lead: "para", kind: "workflowStatus" }],
  },
  {
    tool: "assign_item",
    label: "atribuir o item",
    needsItem: true,
    params: [{ key: "assigneeId", label: "responsável", lead: "a", kind: "member" }],
  },
  {
    tool: "update_item",
    label: "mudar a prioridade do item",
    needsItem: true,
    params: [{ key: "priority", label: "prioridade", lead: "para", kind: "itemPriority" }],
  },
  {
    tool: "add_item_participant",
    label: "adicionar participante ao item:",
    needsItem: true,
    params: [{ key: "userId", label: "participante", lead: "", kind: "member" }],
  },
  {
    tool: "remove_item_participant",
    label: "remover participante do item:",
    needsItem: true,
    params: [{ key: "userId", label: "participante", lead: "", kind: "member" }],
  },
  {
    tool: "request_item_approval",
    label: "pedir a aprovação do item",
    needsItem: true,
    params: [
      { key: "approverId", label: "aprovador", lead: "a", kind: "member" },
      { key: "note", label: "nota (opcional)", lead: "com a nota", kind: "text", optional: true },
    ],
  },
  {
    tool: "create_item",
    label: "criar um item",
    needsItem: false,
    params: [
      { key: "folderId", label: "pasta", lead: "na pasta", kind: "folder" },
      { key: "title", label: "título", lead: "com o título", kind: "text" },
    ],
  },
];

export function findAction(tool: string) {
  return ACTIONS.find((action) => action.tool === tool);
}

export function actionsForEvent(event: TriggerEventSpec | undefined) {
  return ACTIONS.filter((action) => !action.needsItem || event?.itemIdField);
}

/** Event fields that can feed a param of this kind ("Valor do evento" tab). */
export function eventFieldsForKind(
  event: TriggerEventSpec | undefined,
  kind: FieldKind
): PayloadFieldSpec[] {
  // A free-text param (e.g. an item title) accepts any field's value; an etapa
  // accepts a status category (the category's default etapa).
  return payloadFieldsOf(event).filter(
    (field) =>
      kind === "text" ||
      field.kind === kind ||
      (kind === "workflowStatus" && field.kind === "itemStatus")
  );
}

export function toWorkflowStatusValue(status: string, statusId?: string | null) {
  return statusId ? `${status}:${statusId}` : status;
}

/** Splits a `workflowStatus` value into the `status`/`statusId` params. */
export function parseWorkflowStatusValue(value: string): { status: string; statusId?: string } {
  const [status, statusId] = value.split(":");
  return statusId ? { status, statusId } : { status };
}

const PLACEHOLDER = /^\s*\{\{\s*payload\.([A-Za-z0-9_]+)\s*\}\}\s*$/;

export function toPlaceholder(field: string) {
  return `{{payload.${field}}}`;
}

/** The payload field name when `value` is exactly one `{{payload.FIELD}}` placeholder. */
export function parsePlaceholder(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return PLACEHOLDER.exec(value)?.[1] ?? null;
}
