import {
  emptyDraft,
  emptyParam,
  nextConditionKey,
  type ConditionDraft,
  type ParamDraft,
  type RuleDraft,
} from "@/features/automations/lib/automation-draft";
import type { AnalyticsOperator } from "@/types/analytics";

export interface AutomationTemplate {
  id: string;
  title: string;
  description: string;
  // Called fresh on every use — a draft carries per-instance condition keys.
  build: () => RuleDraft;
}

const condition = (
  field: string,
  operator: AnalyticsOperator,
  value: string
): ConditionDraft => ({ key: nextConditionKey(), field, operator, value });

const fixed = (value = ""): ParamDraft => ({ ...emptyParam(), value });

// Templates stop short of the values that only exist in the user's own
// workspace (which section, which project): those stay blank and highlighted
// in the builder. They are limited to what the trigger whitelist can express —
// e.g. "when a task is created" is not a trigger, so there's no template for it.
export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "done-move-section",
    title: "Mover para a seção de concluídas",
    description:
      "Quando o status de uma tarefa virar Concluída, ela vai sozinha para a seção que você escolher.",
    build: () => ({
      ...emptyDraft(),
      name: "Mover para a seção de concluídas",
      eventType: "tasks.task_status_changed",
      conditions: [condition("toStatus", "equals", "DONE")],
      tool: "move_task",
      params: { sectionId: fixed() },
    }),
  },
  {
    id: "reopened-move-section",
    title: "Devolver ao Backlog ao reabrir",
    description:
      "Quando uma tarefa concluída for reaberta, ela volta para a seção que você escolher (ex.: Backlog).",
    build: () => ({
      ...emptyDraft(),
      name: "Devolver ao Backlog ao reabrir",
      eventType: "tasks.task_status_changed",
      conditions: [
        condition("fromStatus", "equals", "DONE"),
        condition("toStatus", "notEquals", "DONE"),
      ],
      tool: "move_task",
      params: { sectionId: fixed() },
    }),
  },
  {
    id: "urgent-assign-actor",
    title: "Atribuir a quem marcar como Urgente",
    description:
      "Quando a prioridade de uma tarefa virar Urgente, ela é atribuída a quem fez a alteração.",
    build: () => ({
      ...emptyDraft(),
      name: "Atribuir a quem marcar como Urgente",
      eventType: "tasks.task_priority_changed",
      conditions: [condition("priority", "equals", "URGENT")],
      tool: "assign_task",
      params: { assigneeId: { mode: "event", value: "", eventField: "actorId" } },
    }),
  },
  {
    id: "assigned-start",
    title: "Iniciar a tarefa ao atribuir",
    description:
      "Quando alguém for atribuído a uma tarefa, o status dela vira Em progresso.",
    build: () => ({
      ...emptyDraft(),
      name: "Iniciar a tarefa ao atribuir",
      eventType: "tasks.task_assigned",
      conditions: [],
      tool: "change_task_status",
      params: { status: fixed("IN_PROGRESS") },
    }),
  },
];
