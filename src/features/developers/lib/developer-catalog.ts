import type { ApiKeyEnvironment, ApiKeyScope, WebhookEvent } from "@/types/developer";
import { WEBHOOK_EVENTS } from "@/types/developer";

export const API_KEY_SCOPES: ApiKeyScope[] = [
  "items:read",
  "items:write",
  "folders:read",
  "folders:write",
  "workspace:read",
  "webhooks:manage",
];

export const API_KEY_SCOPE_LABEL: Record<ApiKeyScope, string> = {
  "items:read": "Ler itens",
  "items:write": "Criar e editar itens",
  "folders:read": "Ler pastas",
  "folders:write": "Criar e editar pastas",
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
    label: "Itens",
    events: [
      "items.item_status_changed",
      "items.item_assigned",
      "items.item_moved",
      "items.item_parent_changed",
      "items.item_due_date_changed",
      "items.item_priority_changed",
      "items.item_participant_added",
      "items.item_participant_removed",
      "custom_fields.item_custom_field_value_set",
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
    label: "Pastas",
    events: [
      "folders.folder_created",
      "folders.folder_updated",
      "folders.folder_archived",
      "folders.folder_parent_changed",
      "folders.member_removed",
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
  "items.item_status_changed": "Status do item alterado",
  "items.item_assigned": "Responsável do item alterado",
  "items.item_moved": "Item mudou de seção",
  "items.item_parent_changed": "Item virou/deixou de ser subitem",
  "items.item_due_date_changed": "Prazo do item alterado",
  "items.item_priority_changed": "Prioridade do item alterada",
  "items.item_participant_added": "Participante adicionado ao item",
  "items.item_participant_removed": "Participante removido do item",
  "custom_fields.item_custom_field_value_set": "Campo personalizado do item alterado",
  "comments.comment_created": "Comentário criado",
  "sections.section_created": "Seção criada",
  "sections.section_moved": "Seção mudou de posição",
  "sections.section_parent_changed": "Seção virou/deixou de ser subseção",
  "folders.folder_created": "Pasta criada",
  "folders.folder_updated": "Pasta editada",
  "folders.folder_archived": "Pasta arquivada",
  "folders.folder_parent_changed": "Pasta virou/deixou de ser subpasta",
  "folders.member_removed": "Membro removido da pasta",
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
