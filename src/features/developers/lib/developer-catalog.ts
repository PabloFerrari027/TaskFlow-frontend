import type { ApiKeyEnvironment, ApiKeyScope, WebhookEvent } from "@/types/developer";
import { WEBHOOK_EVENTS } from "@/types/developer";

export const API_KEY_SCOPES: ApiKeyScope[] = [
  "tasks:read",
  "tasks:write",
  "projects:read",
  "projects:write",
  "workspace:read",
  "webhooks:manage",
];

export const API_KEY_SCOPE_LABEL: Record<ApiKeyScope, string> = {
  "tasks:read": "Ler tarefas",
  "tasks:write": "Criar e editar tarefas",
  "projects:read": "Ler projetos",
  "projects:write": "Criar e editar projetos",
  "workspace:read": "Ler dados do workspace",
  "webhooks:manage": "Gerenciar webhooks",
};

export const API_KEY_ENVIRONMENT_LABEL: Record<ApiKeyEnvironment, string> = {
  LIVE: "Produção",
  TEST: "Teste",
};

// Same identifiers as the workspace activity log (API.md § 14), grouped by
// entity so the picker reads like the automations trigger list.
export const WEBHOOK_EVENT_GROUPS: { label: string; events: WebhookEvent[] }[] = [
  {
    label: "Tarefas",
    events: [
      "tasks.task_status_changed",
      "tasks.task_assigned",
      "tasks.task_moved",
      "tasks.task_parent_changed",
      "tasks.task_due_date_changed",
      "tasks.task_priority_changed",
      "tasks.task_participant_added",
      "tasks.task_participant_removed",
      "custom_fields.task_custom_field_value_set",
    ],
  },
  {
    label: "Comentários",
    events: ["comments.comment_created"],
  },
  {
    label: "Seções",
    events: ["sections.section_created", "sections.section_moved", "sections.section_parent_changed"],
  },
  {
    label: "Projetos",
    events: [
      "projects.project_created",
      "projects.project_updated",
      "projects.project_archived",
      "projects.project_parent_changed",
      "projects.member_removed",
    ],
  },
  {
    label: "Campos personalizados",
    events: [
      "custom_fields.custom_field_created",
      "custom_fields.custom_field_options_updated",
      "custom_fields.custom_field_archived",
    ],
  },
  {
    label: "Workspace",
    events: [
      "workspaces.workspace_renamed",
      "workspaces.member_added",
      "workspaces.member_removed",
      "workspaces.member_role_changed",
    ],
  },
];

export const WEBHOOK_EVENT_LABEL: Record<WebhookEvent, string> = {
  "tasks.task_status_changed": "Status da tarefa alterado",
  "tasks.task_assigned": "Responsável da tarefa alterado",
  "tasks.task_moved": "Tarefa mudou de seção",
  "tasks.task_parent_changed": "Tarefa virou/deixou de ser subtarefa",
  "tasks.task_due_date_changed": "Prazo da tarefa alterado",
  "tasks.task_priority_changed": "Prioridade da tarefa alterada",
  "tasks.task_participant_added": "Participante adicionado à tarefa",
  "tasks.task_participant_removed": "Participante removido da tarefa",
  "custom_fields.task_custom_field_value_set": "Campo personalizado da tarefa alterado",
  "comments.comment_created": "Comentário criado",
  "sections.section_created": "Seção criada",
  "sections.section_moved": "Seção mudou de posição",
  "sections.section_parent_changed": "Seção virou/deixou de ser subseção",
  "projects.project_created": "Projeto criado",
  "projects.project_updated": "Projeto editado",
  "projects.project_archived": "Projeto arquivado",
  "projects.project_parent_changed": "Projeto virou/deixou de ser subprojeto",
  "projects.member_removed": "Membro removido do projeto",
  "custom_fields.custom_field_created": "Campo personalizado criado",
  "custom_fields.custom_field_options_updated": "Opções do campo personalizado alteradas",
  "custom_fields.custom_field_archived": "Campo personalizado arquivado",
  "workspaces.workspace_renamed": "Workspace renomeado",
  "workspaces.member_added": "Membro adicionado ao workspace",
  "workspaces.member_removed": "Membro removido do workspace",
  "workspaces.member_role_changed": "Papel de um membro do workspace alterado",
};

export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}

export function webhookEventLabel(event: string): string {
  return isWebhookEvent(event) ? WEBHOOK_EVENT_LABEL[event] : event;
}
