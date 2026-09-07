import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { ActivityLogEntry } from "@/types/activity";
import type { TaskPriority, TaskStatus } from "@/types/task";

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && value in TASK_STATUS_LABEL;
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === "string" && value in TASK_PRIORITY_LABEL;
}

function formatDateValue(value: unknown) {
  return typeof value === "string" ? formatDate(value) : null;
}

/**
 * API.md § 14 only pins down one payload shape precisely
 * (`{ fromStatus, toStatus }` for `tasks.task_status_changed`) and just
 * names the other event classes (`TaskAssignedEvent`, `TaskMovedEvent`,
 * `TaskDueDateChangedEvent`, `TaskPriorityChangedEvent`,
 * `CommentCreatedEvent`) without their exact `eventType` string or payload
 * keys. This matches on substrings of `eventType` and only renders a
 * "from → to" detail when the expected payload keys actually show up —
 * otherwise it falls back to a plain action label instead of guessing at a
 * schema that might not match what the server actually sends.
 */
export function describeActivityEntry(entry: ActivityLogEntry): {
  label: string;
  detail: string | null;
} {
  if (entry.entityType === "COMMENT") {
    return { label: "comentou nesta tarefa", detail: null };
  }

  const type = entry.eventType.toLowerCase();
  const payload = entry.payload ?? {};

  if (type.includes("status")) {
    const from = payload.fromStatus;
    const to = payload.toStatus;
    return {
      label: "mudou o status",
      detail:
        isTaskStatus(from) && isTaskStatus(to)
          ? `${TASK_STATUS_LABEL[from]} → ${TASK_STATUS_LABEL[to]}`
          : null,
    };
  }

  if (type.includes("assign")) {
    const to = payload.toAssigneeId ?? payload.assigneeId;
    return {
      label: "alterou o responsável",
      detail: to === null ? "removeu o responsável" : null,
    };
  }

  if (type.includes("moved") || type.includes("position") || type.includes("section")) {
    return { label: "moveu a tarefa", detail: null };
  }

  if (type.includes("due_date") || type.includes("duedate")) {
    const to = formatDateValue(payload.toDueDate ?? payload.dueDate);
    return { label: "alterou o prazo", detail: to };
  }

  if (type.includes("priority")) {
    const to = payload.toPriority ?? payload.priority;
    return {
      label: "alterou a prioridade",
      detail: isTaskPriority(to) ? TASK_PRIORITY_LABEL[to] : null,
    };
  }

  if (type.includes("created")) {
    return { label: "criou a tarefa", detail: null };
  }

  // Unrecognized event class — still show something rather than nothing,
  // humanized from the raw eventType (e.g. "tasks.task_reopened" → "task reopened").
  const humanized = entry.eventType.split(".").pop()?.replace(/_/g, " ") ?? entry.eventType;
  return { label: humanized, detail: null };
}
