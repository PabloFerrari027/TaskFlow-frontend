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
// workspace (which section, which folder): those stay blank and highlighted
// in the builder. They are limited to what the trigger whitelist can express.
export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "done-move-section",
    title: "Mover para a seção de concluídas",
    description:
      "Quando o status de um item virar Concluída, ele vai sozinho para a seção que você escolher.",
    build: () => ({
      ...emptyDraft(),
      name: "Mover para a seção de concluídas",
      eventType: "items.item_status_changed",
      conditions: [condition("toStatus", "equals", "DONE")],
      tool: "move_item",
      params: { sectionId: fixed() },
    }),
  },
  {
    id: "reopened-move-section",
    title: "Devolver ao Backlog ao reabrir",
    description:
      "Quando um item concluído for reaberto, ele volta para a seção que você escolher (ex.: Backlog).",
    build: () => ({
      ...emptyDraft(),
      name: "Devolver ao Backlog ao reabrir",
      eventType: "items.item_status_changed",
      conditions: [
        condition("fromStatus", "equals", "DONE"),
        condition("toStatus", "notEquals", "DONE"),
      ],
      tool: "move_item",
      params: { sectionId: fixed() },
    }),
  },
  {
    id: "urgent-assign-actor",
    title: "Atribuir a quem marcar como Urgente",
    description:
      "Quando a prioridade de um item virar Urgente, ele é atribuído a quem fez a alteração.",
    build: () => ({
      ...emptyDraft(),
      name: "Atribuir a quem marcar como Urgente",
      eventType: "items.item_priority_changed",
      conditions: [condition("priority", "equals", "URGENT")],
      tool: "assign_item",
      params: { assigneeId: { mode: "event", value: "", eventField: "actorId" } },
    }),
  },
  {
    id: "assigned-start",
    title: "Iniciar o item ao atribuir",
    description:
      "Quando alguém for atribuído a um item, o status dele vira Em progresso.",
    build: () => ({
      ...emptyDraft(),
      name: "Iniciar o item ao atribuir",
      eventType: "items.item_assigned",
      conditions: [],
      tool: "change_item_status",
      params: { status: fixed("IN_PROGRESS") },
    }),
  },
  {
    id: "overdue-urgent",
    title: "Item atrasado vira Urgente",
    description: "Quando um item passar do prazo, a prioridade dele vira Urgente sozinha.",
    build: () => ({
      ...emptyDraft(),
      name: "Item atrasado vira Urgente",
      eventType: "items.item_overdue",
      conditions: [],
      tool: "update_item",
      params: { priority: fixed("URGENT") },
    }),
  },
  {
    id: "created-assign-actor",
    title: "Quem cria o item fica responsável",
    description: "Todo item novo é atribuído a quem o criou.",
    build: () => ({
      ...emptyDraft(),
      name: "Quem cria o item fica responsável",
      eventType: "items.item_created",
      conditions: [],
      tool: "assign_item",
      params: { assigneeId: { mode: "event", value: "", eventField: "actorId" } },
    }),
  },
  {
    id: "approved-done",
    title: "Concluir ao ser aprovada",
    description: "Quando um pedido de aprovação de um item for aprovado, ele passa para Concluída.",
    build: () => ({
      ...emptyDraft(),
      name: "Concluir ao ser aprovada",
      eventType: "approvals.approval_decided",
      conditions: [condition("decision", "equals", "APPROVED")],
      tool: "change_item_status",
      params: { status: fixed("DONE") },
    }),
  },
];
