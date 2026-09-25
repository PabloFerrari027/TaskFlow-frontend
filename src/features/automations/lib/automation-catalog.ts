import type { AnalyticsOperator } from "@/types/analytics";
import type { AutomationEntityType } from "@/types/automation";

/**
 * Frontend copy of the backend whitelists (automation-trigger-whitelist.ts and
 * the `automatable` actions in action-registry.ts) — there is no endpoint that
 * lists them, so this must be updated by hand when the backend adds an event
 * or action. The backend validates every rule on save, so a stale entry here
 * fails loudly (INVALID_AUTOMATION_*), never silently.
 *
 * Wording note: event phrases follow "Quando [uma tarefa] [tiver o status
 * alterado]…" — second-person/conditional, not the past tense that
 * `describeActivityEntry` uses for the (already happened) activity feed.
 */

export type FieldKind =
  | "member"
  | "project"
  | "section"
  | "taskStatus"
  | "taskPriority"
  | "projectStatus"
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
  // Which payload field holds the id of the affected task, when the event has
  // one — what lets a task action target "the task this happened to".
  taskIdField: "entityId" | "taskId" | null;
}

export const ENTITY_LABEL: Record<AutomationEntityType, string> = {
  TASK: "uma tarefa",
  COMMENT: "um comentário",
  SECTION: "uma seção",
  PROJECT: "um projeto",
  CUSTOM_FIELD: "um campo personalizado",
  WORKSPACE: "o workspace",
};

export const ENTITY_TYPES = Object.keys(ENTITY_LABEL) as AutomationEntityType[];

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

const PROJECT_ID = f("projectId", "projeto", "o", "project");

export const TRIGGER_EVENTS: TriggerEventSpec[] = [
  // ---------------------------------------------------------------- TASK
  {
    entityType: "TASK",
    eventType: "tasks.task_status_changed",
    phrase: "tiver o status alterado",
    fields: [
      PROJECT_ID,
      f("fromStatus", "status anterior", "o", "taskStatus"),
      f("toStatus", "novo status", "o", "taskStatus"),
    ],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_assigned",
    phrase: "tiver o responsável alterado",
    fields: [
      PROJECT_ID,
      f("assigneeId", "novo responsável", "o", "member"),
      f("previousAssigneeId", "responsável anterior", "o", "member"),
    ],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_moved",
    phrase: "mudar de seção",
    fields: [
      PROJECT_ID,
      f("fromSectionId", "seção de origem", "a", "section"),
      f("toSectionId", "seção de destino", "a", "section"),
    ],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_parent_changed",
    phrase: "virar subtarefa de outra tarefa",
    fields: [
      PROJECT_ID,
      f("fromParentId", "tarefa principal anterior", "a", "text"),
      f("toParentId", "nova tarefa principal", "a", "text"),
    ],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_due_date_changed",
    phrase: "tiver o prazo alterado",
    fields: [PROJECT_ID, f("dueDate", "novo prazo", "o", "date")],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_priority_changed",
    phrase: "tiver a prioridade alterada",
    fields: [PROJECT_ID, f("priority", "nova prioridade", "a", "taskPriority")],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_participant_added",
    phrase: "ganhar um participante",
    fields: [f("userId", "participante", "o", "member")],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "tasks.task_participant_removed",
    phrase: "perder um participante",
    fields: [f("userId", "participante", "o", "member")],
    taskIdField: "entityId",
  },
  {
    entityType: "TASK",
    eventType: "custom_fields.task_custom_field_value_set",
    phrase: "tiver um campo personalizado alterado",
    fields: [
      PROJECT_ID,
      f("definitionId", "campo personalizado", "o", "text"),
      f("previousValue", "valor anterior", "o", "text"),
      f("newValue", "novo valor", "o", "text"),
    ],
    taskIdField: "entityId",
  },
  // ------------------------------------------------------------- COMMENT
  {
    entityType: "COMMENT",
    eventType: "comments.comment_created",
    phrase: "for criado",
    fields: [
      f("taskId", "tarefa", "a", "text"),
      f("authorId", "autor do comentário", "o", "member"),
      f("parentId", "comentário respondido", "o", "text"),
    ],
    taskIdField: "taskId",
  },
  // ------------------------------------------------------------- SECTION
  {
    entityType: "SECTION",
    eventType: "sections.section_created",
    phrase: "for criada",
    fields: [PROJECT_ID, f("name", "nome", "o", "text")],
    taskIdField: null,
  },
  {
    entityType: "SECTION",
    eventType: "sections.section_moved",
    phrase: "mudar de posição",
    fields: [
      PROJECT_ID,
      f("fromPosition", "posição anterior", "a", "number"),
      f("toPosition", "nova posição", "a", "number"),
    ],
    taskIdField: null,
  },
  {
    entityType: "SECTION",
    eventType: "sections.section_parent_changed",
    phrase: "virar subseção de outra seção",
    fields: [
      PROJECT_ID,
      f("fromParentId", "seção principal anterior", "a", "section"),
      f("toParentId", "nova seção principal", "a", "section"),
    ],
    taskIdField: null,
  },
  // ------------------------------------------------------------- PROJECT
  {
    entityType: "PROJECT",
    eventType: "projects.project_created",
    phrase: "for criado",
    fields: [],
    taskIdField: null,
  },
  {
    entityType: "PROJECT",
    eventType: "projects.project_updated",
    phrase: "for editado",
    fields: [f("name", "nome", "o", "text"), f("description", "descrição", "a", "text")],
    taskIdField: null,
  },
  {
    entityType: "PROJECT",
    eventType: "projects.project_archived",
    phrase: "for arquivado",
    fields: [],
    taskIdField: null,
  },
  {
    entityType: "PROJECT",
    eventType: "projects.project_parent_changed",
    phrase: "virar subprojeto de outro projeto",
    fields: [
      f("fromParentId", "projeto principal anterior", "o", "project"),
      f("toParentId", "novo projeto principal", "o", "project"),
    ],
    taskIdField: null,
  },
  {
    entityType: "PROJECT",
    eventType: "projects.member_removed",
    phrase: "perder um membro",
    fields: [f("userId", "membro removido", "o", "member")],
    taskIdField: null,
  },
  // --------------------------------------------------------- CUSTOM_FIELD
  {
    entityType: "CUSTOM_FIELD",
    eventType: "custom_fields.custom_field_created",
    phrase: "for criado",
    fields: [PROJECT_ID, f("name", "nome", "o", "text"), f("type", "tipo", "o", "text")],
    taskIdField: null,
  },
  {
    entityType: "CUSTOM_FIELD",
    eventType: "custom_fields.custom_field_options_updated",
    phrase: "tiver as opções alteradas",
    fields: [PROJECT_ID],
    taskIdField: null,
  },
  {
    entityType: "CUSTOM_FIELD",
    eventType: "custom_fields.custom_field_archived",
    phrase: "for arquivado",
    fields: [PROJECT_ID],
    taskIdField: null,
  },
  // ----------------------------------------------------------- WORKSPACE
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.workspace_created",
    phrase: "for criado",
    fields: [f("name", "nome", "o", "text")],
    taskIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.workspace_renamed",
    phrase: "for renomeado",
    fields: [f("previousName", "nome anterior", "o", "text"), f("name", "novo nome", "o", "text")],
    taskIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.workspace_deleted",
    phrase: "for excluído",
    fields: [],
    taskIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.member_added",
    phrase: "ganhar um membro",
    fields: [f("userId", "novo membro", "o", "member"), f("role", "papel", "o", "text")],
    taskIdField: null,
  },
  {
    entityType: "WORKSPACE",
    eventType: "workspaces.member_removed",
    phrase: "perder um membro",
    fields: [f("userId", "membro removido", "o", "member")],
    taskIdField: null,
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
    taskIdField: null,
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
}

export interface ActionSpec {
  tool: string;
  // The verb phrase shown in the tool chip.
  label: string;
  // Needs "the task this happened to" — only offered for events that carry one.
  needsTask: boolean;
  // Only the params the sentence builder edits; anything else a rule already
  // carries (e.g. move_task's `position`) is preserved untouched on save.
  params: ActionParamSpec[];
}

export const ACTIONS: ActionSpec[] = [
  {
    tool: "move_task",
    label: "mover a tarefa",
    needsTask: true,
    params: [{ key: "sectionId", label: "seção", lead: "para a seção", kind: "section" }],
  },
  {
    tool: "change_task_status",
    label: "mudar o status da tarefa",
    needsTask: true,
    params: [{ key: "status", label: "status", lead: "para", kind: "taskStatus" }],
  },
  {
    tool: "assign_task",
    label: "atribuir a tarefa",
    needsTask: true,
    params: [{ key: "assigneeId", label: "responsável", lead: "a", kind: "member" }],
  },
  {
    tool: "update_task",
    label: "mudar a prioridade da tarefa",
    needsTask: true,
    params: [{ key: "priority", label: "prioridade", lead: "para", kind: "taskPriority" }],
  },
  {
    tool: "add_task_participant",
    label: "adicionar participante à tarefa:",
    needsTask: true,
    params: [{ key: "userId", label: "participante", lead: "", kind: "member" }],
  },
  {
    tool: "remove_task_participant",
    label: "remover participante da tarefa:",
    needsTask: true,
    params: [{ key: "userId", label: "participante", lead: "", kind: "member" }],
  },
  {
    tool: "create_task",
    label: "criar uma tarefa",
    needsTask: false,
    params: [
      { key: "projectId", label: "projeto", lead: "no projeto", kind: "project" },
      { key: "title", label: "título", lead: "com o título", kind: "text" },
    ],
  },
];

export function findAction(tool: string) {
  return ACTIONS.find((action) => action.tool === tool);
}

export function actionsForEvent(event: TriggerEventSpec | undefined) {
  return ACTIONS.filter((action) => !action.needsTask || event?.taskIdField);
}

/** Event fields that can feed a param of this kind ("Valor do evento" tab). */
export function eventFieldsForKind(
  event: TriggerEventSpec | undefined,
  kind: FieldKind
): PayloadFieldSpec[] {
  // A free-text param (e.g. a task title) accepts any field's value.
  return payloadFieldsOf(event).filter((field) => kind === "text" || field.kind === kind);
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
