import { ITEM_PRIORITY_LABEL, ITEM_STATUS_LABEL } from "@/components/shared/status-badge";
import { formatDate, formatMinutes } from "@/lib/format";
import { formatCustomFieldValue } from "@/features/custom-fields/lib/format-custom-field-value";
import type { ActivityLogEntry } from "@/types/activity";
import type { ItemPriority, ItemStatus } from "@/types/item";

function isItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && value in ITEM_STATUS_LABEL;
}

function isItemPriority(value: unknown): value is ItemPriority {
  return typeof value === "string" && value in ITEM_PRIORITY_LABEL;
}

function formatDateValue(value: unknown) {
  return typeof value === "string" ? formatDate(value) : null;
}

/**
 * Confirmed against the backend source (item.events.ts / comment.events.ts):
 * every `eventType` this handles is a fixed literal string returned by an
 * `eventName` getter, passed straight through to the DB and the API
 * response with no transformation — the backend IS consistent and exactly
 * matches API.md § 14. The substring matching below is deliberately
 * defensive rather than a workaround for a real inconsistency: it tolerates
 * a future new `eventType` (or a payload key rename) without needing a
 * frontend deploy in lockstep, and only renders a "from → to" detail when
 * the expected payload keys actually show up. Don't "simplify" this to an
 * exact `Record<string, ...>` lookup thinking the substring matching is
 * leftover caution from an unconfirmed contract — it isn't.
 */
export interface ActivityFieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface ActivityDescribeContext {
  /** sectionId → name, so section moves can show "Coluna A → Coluna B". Only available where the folder is known. */
  sectionNames?: ReadonlyMap<string, string>;
}

function sectionLabel(value: unknown, context: ActivityDescribeContext | undefined) {
  const names = context?.sectionNames;
  if (typeof value !== "string" || !names) return null;
  // Not in the loaded list = the section was deleted — never leak the raw id.
  return names.get(value) ?? "coluna removida";
}

function readTextChange(value: unknown): { from: string | null; to: string | null } | null {
  if (typeof value !== "object" || value === null) return null;
  const { from, to } = value as { from?: unknown; to?: unknown };
  return {
    from: typeof from === "string" ? from : null,
    to: typeof to === "string" ? to : null,
  };
}

const EXACT_LABELS: Record<string, string> = {
  "recurring_items.item_recurrence_created": "criou um item repetido",
  "recurring_items.item_recurrence_updated": "editou um item repetido",
  "recurring_items.item_recurrence_deleted": "removeu um item repetido",
  "recurring_items.item_recurrence_enabled_changed": "ligou ou desligou um item repetido",
  "recurring_items.item_recurrence_auto_disabled": "um item repetido foi desligado automaticamente",
  "items.item_workflow_status_changed": "mudou a etapa",
  "items.item_assignees_changed": "alterou os responsáveis",
  "items.item_schedule_changed": "alterou o início ou o marco",
  "items.item_estimate_changed": "alterou a estimativa",
  "items.item_dependency_added": "ligou o item a outro do qual ele depende",
  "items.item_dependency_removed": "removeu uma dependência",
  "items.item_restored": "restaurou o item da lixeira",
  "items.item_deleted": "mandou o item para a lixeira",
  "items.item_unblocked": "o item foi liberado (as dependências terminaram)",
  "items.item_due_soon": "o prazo está chegando",
  "items.item_overdue": "o item passou do prazo",
  "approvals.approval_requested": "pediu aprovação",
  "approvals.approval_decided": "respondeu um pedido de aprovação",
};

function describeExactDetail(type: string, payload: Record<string, unknown>): string | null {
  if (type === "approvals.approval_decided") {
    return payload.decision === "APPROVED" ? "aprovada" : payload.decision === "REJECTED" ? "recusada" : null;
  }
  if (type === "items.item_schedule_changed") {
    return formatDateValue(payload.startDate);
  }
  if (type === "items.item_estimate_changed") {
    const parts: string[] = [];
    if (typeof payload.estimateMinutes === "number") parts.push(formatMinutes(payload.estimateMinutes));
    if (typeof payload.storyPoints === "number") parts.push(`${payload.storyPoints} pontos`);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (type === "items.item_workflow_status_changed" && isItemStatus(payload.category)) {
    return ITEM_STATUS_LABEL[payload.category];
  }
  if (type === "recurring_items.item_recurrence_created" || type === "recurring_items.item_recurrence_updated") {
    return typeof payload.title === "string" ? payload.title : null;
  }
  return null;
}

export function describeActivityEntry(
  entry: ActivityLogEntry,
  context?: ActivityDescribeContext
): {
  label: string;
  detail: string | null;
  /** Set for assignee changes so the feed can render the user labels (names aren't resolvable here). */
  assigneeChange?: { from: string | null; to: string | null };
  /** Set for title/description edits — long text, rendered as a before/after block instead of inline. */
  fieldChanges?: ActivityFieldChange[];
} {
  if (entry.entityType === "COMMENT") {
    if (entry.eventType.toLowerCase().includes("edited")) {
      return { label: "editou um comentário", detail: null };
    }
    return { label: "comentou neste item", detail: null };
  }

  const type = entry.eventType.toLowerCase();
  const payload = entry.payload ?? {};

  // Exact labels for the events whose names would otherwise trip the
  // substring matching below ("item_recurrence_created" → "criou o item").
  const exact = EXACT_LABELS[type];
  if (exact) {
    return { label: exact, detail: describeExactDetail(type, payload) };
  }

  // Checked before the generic eventType substring matching below — a
  // "sections.section_created"/"sections.section_moved" eventType would
  // otherwise match the "created"/"section" branches meant for items (see
  // module doc comment above) and render a wrong, item-flavored label.
  if (entry.entityType === "SECTION") {
    if (type.includes("moved")) {
      return { label: "moveu a seção", detail: null };
    }    const name = typeof payload.name === "string" ? payload.name : null;
    return { label: "criou a seção", detail: name };
  }

  if (entry.entityType === "CUSTOM_FIELD") {
    if (type.includes("archived")) {
      return { label: "arquivou o campo personalizado", detail: null };
    }
    if (type.includes("options")) {
      const options = Array.isArray(payload.options) ? (payload.options as unknown[]) : null;
      return {
        label: "atualizou as opções do campo personalizado",
        detail: options ? options.join(", ") : null,
      };
    }
    const name = typeof payload.name === "string" ? payload.name : null;
    return { label: "criou um campo personalizado", detail: name };
  }

  // Before the generic substring matching for the same reason as SECTION above.
  if (type.includes("fields_changed")) {
    const title = readTextChange(payload.title);
    const description = readTextChange(payload.description);
    const fieldChanges: ActivityFieldChange[] = [
      ...(title ? [{ field: "Título", ...title }] : []),
      ...(description ? [{ field: "Descrição", ...description }] : []),
    ];
    const label =
      title && description
        ? "alterou o título e a descrição"
        : title
          ? "alterou o título"
          : "alterou a descrição";
    return { label, detail: null, fieldChanges };
  }

  if (type.includes("parent")) {
    const to = payload.toParentId;
    return {
      label: typeof to === "string" ? "transformou o item em subitem" : "promoveu o subitem o item principal",
      detail: null,
    };
  }

  if (type.includes("status")) {
    const from = payload.fromStatus;
    const to = payload.toStatus;
    return {
      label: "mudou o status",
      detail:
        isItemStatus(from) && isItemStatus(to)
          ? `${ITEM_STATUS_LABEL[from]} → ${ITEM_STATUS_LABEL[to]}`
          : null,
    };
  }

  if (type.includes("assign")) {
    const to = payload.toAssigneeId ?? payload.assigneeId;
    const from = payload.previousAssigneeId;
    return {
      label: "alterou o responsável",
      detail: null,
      assigneeChange: {
        from: typeof from === "string" ? from : null,
        to: typeof to === "string" ? to : null,
      },
    };
  }

  if (type.includes("moved") || type.includes("position") || type.includes("section")) {
    const from = sectionLabel(payload.fromSectionId, context);
    const to = sectionLabel(payload.toSectionId, context);
    return { label: "moveu o item", detail: from && to ? `${from} → ${to}` : null };
  }

  if (type.includes("due_date") || type.includes("duedate")) {
    const to = formatDateValue(payload.toDueDate ?? payload.dueDate) ?? "sem prazo";
    // Entries logged before the backend started sending `previousDueDate`
    // don't have the key at all — only show the new value for those.
    const from =
      "previousDueDate" in payload ? (formatDateValue(payload.previousDueDate) ?? "sem prazo") : null;
    return { label: "alterou o prazo", detail: from ? `${from} → ${to}` : to };
  }

  if (type.includes("priority")) {
    const rawTo = payload.toPriority ?? payload.priority;
    const to = isItemPriority(rawTo) ? ITEM_PRIORITY_LABEL[rawTo] : "sem prioridade";
    const rawFrom = payload.previousPriority;
    const from =
      "previousPriority" in payload
        ? isItemPriority(rawFrom)
          ? ITEM_PRIORITY_LABEL[rawFrom]
          : "sem prioridade"
        : null;
    return { label: "alterou a prioridade", detail: from ? `${from} → ${to}` : to };
  }

  if (type.includes("custom_field") && "newValue" in payload) {
    return {
      label: "alterou um campo personalizado",
      detail: `${formatCustomFieldValue(payload.previousValue)} → ${formatCustomFieldValue(payload.newValue)}`,
    };
  }

  if (type.includes("created")) {
    return { label: "criou o item", detail: null };
  }

  // Unrecognized event class — still show something rather than nothing,
  // humanized from the raw eventType (e.g. "items.item_reopened" → "item reopened").
  const humanized = entry.eventType.split(".").pop()?.replace(/_/g, " ") ?? entry.eventType;
  return { label: humanized, detail: null };
}
