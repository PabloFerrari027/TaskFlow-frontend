import type { AnalyticsOperator } from "@/types/analytics";
import type {
  AutomationRule,
  CreateAutomationRuleRequest,
} from "@/types/automation";
import {
  ACTOR_FIELD,
  ENTITY_LABEL,
  OPERATOR_LABEL,
  actionsForEvent,
  eventsOfEntity,
  findAction,
  findTriggerEvent,
  parsePlaceholder,
  payloadFieldsOf,
  toPlaceholder,
  type ActionSpec,
  type FieldKind,
  type TriggerEventSpec,
} from "@/features/automations/lib/automation-catalog";

/**
 * The editable, always-renderable shape of a rule — every value is a plain
 * string (or string list) so it can sit half-filled in an inline field. It is
 * converted to/from the API shape only at the edges (`fromRule` / `toRequest`).
 */
export interface ParamDraft {
  // "fixed" is the default; "event" is the `{{payload.FIELD}}` placeholder.
  mode: "fixed" | "event";
  value: string;
  eventField: string;
}

export interface ConditionDraft {
  key: string;
  field: string;
  operator: AnalyticsOperator;
  // string for scalar operators, string[] for `in` / `between`.
  value: string | string[];
}

export interface RuleDraft {
  name: string;
  entityType: string;
  eventType: string;
  conditions: ConditionDraft[];
  tool: string;
  params: Record<string, ParamDraft>;
  // Params the sentence doesn't edit (a rule created via the API can carry
  // e.g. move_task's `position`, or a hand-written `taskId`) — kept as-is so
  // editing a rule here never silently drops them.
  extraParams: Record<string, unknown>;
}

let conditionCounter = 0;
export function nextConditionKey() {
  conditionCounter += 1;
  return `condition-${conditionCounter}`;
}

const EMPTY_PARAM: ParamDraft = { mode: "fixed", value: "", eventField: "" };

export function emptyParam(): ParamDraft {
  return { ...EMPTY_PARAM };
}

export function emptyDraft(): RuleDraft {
  const first = eventsOfEntity("TASK")[0];
  return {
    name: "",
    entityType: "TASK",
    eventType: first?.eventType ?? "",
    conditions: [],
    tool: "",
    params: {},
    extraParams: {},
  };
}

// ----------------------------------------------------------------- reducers

export function withEntity(draft: RuleDraft, entityType: string): RuleDraft {
  if (entityType === draft.entityType) return draft;
  const first = eventsOfEntity(entityType)[0];
  return withEvent({ ...draft, entityType, eventType: "" }, first?.eventType ?? "");
}

// Changing the event drops whatever no longer exists on the new one, rather
// than leaving a condition/param pointing at a payload field it doesn't carry.
export function withEvent(draft: RuleDraft, eventType: string): RuleDraft {
  const event = findTriggerEvent(draft.entityType, eventType);
  const available = new Set(payloadFieldsOf(event).map((field) => field.field));

  const params: Record<string, ParamDraft> = {};
  for (const [key, param] of Object.entries(draft.params)) {
    params[key] =
      param.mode === "event" && !available.has(param.eventField) ? emptyParam() : param;
  }

  const toolAllowed = actionsForEvent(event).some((action) => action.tool === draft.tool);

  return {
    ...draft,
    eventType,
    conditions: draft.conditions.filter((condition) => available.has(condition.field)),
    tool: toolAllowed ? draft.tool : "",
    params: toolAllowed ? params : {},
    extraParams: toolAllowed ? draft.extraParams : {},
  };
}

export function withTool(draft: RuleDraft, tool: string): RuleDraft {
  if (tool === draft.tool) return draft;
  const spec = findAction(tool);
  const previous = findAction(draft.tool);
  const params: Record<string, ParamDraft> = {};
  for (const param of spec?.params ?? []) {
    // Carry a value over only when the same param means the same thing.
    const before = previous?.params.find((p) => p.key === param.key && p.kind === param.kind);
    params[param.key] = before ? (draft.params[param.key] ?? emptyParam()) : emptyParam();
  }
  return { ...draft, tool, params, extraParams: {} };
}

/** Reshapes a condition value when its operator changes (scalar ⇄ list). */
export function coerceConditionValue(
  operator: AnalyticsOperator,
  value: string | string[]
): string | string[] {
  if (operator === "in" || operator === "between") {
    return Array.isArray(value) ? value : value === "" ? [] : [value];
  }
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

// --------------------------------------------------------- API ⇄ draft

export function fromRule(rule: AutomationRule): RuleDraft {
  const spec = findAction(rule.action.tool);
  const specKeys = new Set(spec?.params.map((param) => param.key));

  const params: Record<string, ParamDraft> = {};
  for (const param of spec?.params ?? []) {
    const raw = rule.action.params[param.key];
    const eventField = parsePlaceholder(raw);
    params[param.key] = eventField
      ? { mode: "event", value: "", eventField }
      : { mode: "fixed", value: raw === undefined || raw === null ? "" : String(raw), eventField: "" };
  }

  const extraParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rule.action.params)) {
    if (!specKeys.has(key)) extraParams[key] = value;
  }

  return {
    name: rule.name,
    entityType: rule.trigger.entityType,
    eventType: rule.trigger.eventType,
    conditions: rule.trigger.conditions.map((condition) => ({
      key: nextConditionKey(),
      field: condition.field,
      operator: condition.operator,
      value: Array.isArray(condition.value)
        ? condition.value.map(String)
        : String(condition.value ?? ""),
    })),
    tool: rule.action.tool,
    params,
    extraParams,
  };
}

function conditionKind(event: TriggerEventSpec | undefined, field: string): FieldKind {
  return payloadFieldsOf(event).find((spec) => spec.field === field)?.kind ?? "text";
}

// Ordering operators compare numbers; anything numeric-looking becomes one so
// "5" isn't compared as text. Everything else stays a string.
function parseScalar(value: string): string | number {
  const trimmed = value.trim();
  return trimmed !== "" && Number.isFinite(Number(trimmed)) ? Number(trimmed) : trimmed;
}

function conditionValueForRequest(
  operator: AnalyticsOperator,
  value: string | string[],
  kind: FieldKind
): unknown {
  if (operator === "in") {
    return (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
  }
  if (operator === "between") {
    return (Array.isArray(value) ? value : [value]).map(parseScalar);
  }
  const scalar = Array.isArray(value) ? (value[0] ?? "") : value;
  return operator === "greaterThan" || operator === "lessThan" || kind === "number"
    ? parseScalar(scalar)
    : scalar;
}

export function toRequest(draft: RuleDraft, fallbackName: string): CreateAutomationRuleRequest {
  const event = findTriggerEvent(draft.entityType, draft.eventType);
  const spec = findAction(draft.tool);

  const params: Record<string, unknown> = {};
  // "The task this happened to" is implied by the trigger, never asked.
  if (spec?.needsTask && event?.taskIdField && !("taskId" in draft.extraParams)) {
    params.taskId = toPlaceholder(event.taskIdField);
  }
  for (const param of spec?.params ?? []) {
    const draftParam = draft.params[param.key];
    if (!draftParam) continue;
    const value =
      draftParam.mode === "event" ? toPlaceholder(draftParam.eventField) : draftParam.value;
    if (value !== "") params[param.key] = value;
  }
  Object.assign(params, draft.extraParams);

  return {
    name: draft.name.trim() || fallbackName,
    trigger: {
      entityType: draft.entityType,
      eventType: draft.eventType,
      conditions: draft.conditions.map((condition) => ({
        field: condition.field,
        operator: condition.operator,
        value: conditionValueForRequest(
          condition.operator,
          condition.value,
          conditionKind(event, condition.field)
        ),
      })),
    },
    action: { tool: draft.tool, params },
  };
}

// --------------------------------------------------------------- validation

function isConditionComplete(condition: ConditionDraft) {
  if (!condition.field) return false;
  if (condition.operator === "between") {
    return Array.isArray(condition.value) && condition.value.length === 2 && condition.value.every((v) => v.trim() !== "");
  }
  if (condition.operator === "in") {
    return Array.isArray(condition.value) && condition.value.some((v) => v.trim() !== "");
  }
  return typeof condition.value === "string" && condition.value.trim() !== "";
}

export function isParamComplete(param: ParamDraft | undefined) {
  if (!param) return false;
  return param.mode === "event" ? param.eventField !== "" : param.value.trim() !== "";
}

/** What's still missing, in the order the sentence reads. Empty = ready to save. */
export function validateDraft(draft: RuleDraft): string[] {
  const problems: string[] = [];
  const event = findTriggerEvent(draft.entityType, draft.eventType);
  if (!event) problems.push("o evento que dispara a regra");
  if (draft.conditions.some((condition) => !isConditionComplete(condition))) {
    problems.push("o valor de cada condição");
  }
  const spec = findAction(draft.tool);
  if (!draft.tool) problems.push("a ação");
  for (const param of spec?.params ?? []) {
    if (!isParamComplete(draft.params[param.key])) problems.push(`${param.label} da ação`);
  }
  return problems;
}

// ----------------------------------------------------------------- sentence

export interface SentenceSegment {
  text: string;
  // "value" is something the user chose (shown emphasized); "missing" is a
  // blank still to fill.
  tone: "plain" | "value" | "missing";
}

// Resolves an id/enum to what a person would call it. Implemented by
// `useAutomationLookups` (needs the workspace's projects/sections/members).
export interface ValueLabeler {
  labelFor(kind: FieldKind, value: string): string;
}

const plain = (text: string): SentenceSegment => ({ text, tone: "plain" });
const value = (text: string): SentenceSegment => ({ text, tone: "value" });
const missing = (text: string): SentenceSegment => ({ text: `[${text}]`, tone: "missing" });

export function eventValueText(fieldName: string, event: TriggerEventSpec | undefined) {
  if (fieldName === ACTOR_FIELD.field) return "quem fez a alteração";
  const field = payloadFieldsOf(event).find((spec) => spec.field === fieldName);
  return `valor do evento (${field?.label ?? fieldName})`;
}

function conditionValueSegments(
  condition: ConditionDraft,
  kind: FieldKind,
  labeler: ValueLabeler
): SentenceSegment[] {
  const items = Array.isArray(condition.value) ? condition.value : [condition.value];
  const filled = items.filter((item) => item.trim() !== "");
  if (filled.length === 0) return [missing("valor")];
  const labels = filled.map((item) => labeler.labelFor(kind, item));
  return [value(condition.operator === "between" ? labels.join(" e ") : labels.join(", "))];
}

function paramSegments(
  spec: ActionSpec,
  draft: RuleDraft,
  event: TriggerEventSpec | undefined,
  labeler: ValueLabeler
): SentenceSegment[] {
  return spec.params.flatMap((param) => {
    const draftParam = draft.params[param.key];
    const lead = param.lead ? [plain(` ${param.lead}`)] : [];
    if (!isParamComplete(draftParam)) return [...lead, plain(" "), missing(param.label)];
    const text =
      draftParam.mode === "event"
        ? eventValueText(draftParam.eventField, event)
        : labeler.labelFor(param.kind, draftParam.value);
    return [...lead, plain(" "), value(text)];
  });
}

/** The whole rule as a sentence — the same text the builder edits inline. */
export function describeDraft(draft: RuleDraft, labeler: ValueLabeler): SentenceSegment[] {
  const event = findTriggerEvent(draft.entityType, draft.eventType);
  const entity = (ENTITY_LABEL as Record<string, string | undefined>)[draft.entityType];

  const segments: SentenceSegment[] = [plain(`Quando ${entity ?? draft.entityType} `)];
  segments.push(event ? plain(event.phrase) : missing("evento"));

  for (const condition of draft.conditions) {
    const field = payloadFieldsOf(event).find((spec) => spec.field === condition.field);
    const subject = field ? `${field.article} ${field.label}` : condition.field;
    segments.push(
      plain(` e ${subject} ${OPERATOR_LABEL[condition.operator]} `),
      ...conditionValueSegments(condition, field?.kind ?? "text", labeler)
    );
  }

  const spec = findAction(draft.tool);
  segments.push(plain(", então "));
  if (!draft.tool) {
    segments.push(missing("ação"));
  } else if (spec) {
    segments.push(plain(spec.label), ...paramSegments(spec, draft, event, labeler));
  } else {
    segments.push(plain(draft.tool));
  }
  segments.push(plain("."));
  return segments;
}

export function segmentsToText(segments: SentenceSegment[]) {
  return segments.map((segment) => segment.text).join("");
}

const MAX_NAME_LENGTH = 120;

/** A name for a rule the user didn't name — its own sentence, trimmed to the API's limit. */
export function autoName(draft: RuleDraft, labeler: ValueLabeler) {
  const text = segmentsToText(describeDraft(draft, labeler));
  return text.length <= MAX_NAME_LENGTH ? text : `${text.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…`;
}
