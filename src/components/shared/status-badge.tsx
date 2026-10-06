import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FolderRole, FolderStatus } from "@/types/folder";
import type { ItemPriority, ItemStatus } from "@/types/item";
import type { WorkspaceRole } from "@/types/workspace";
import type { InvitationStatus } from "@/types/common";
import type { ClientStatus } from "@/types/client";
import type { ApiKeyEnvironment, WebhookDeliveryStatus } from "@/types/developer";

export const FOLDER_STATUS_LABEL: Record<FolderStatus, string> = {
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};

const FOLDER_STATUS_CLASS: Record<FolderStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function FolderStatusBadge({ status }: { status: FolderStatus }) {
  return (
    <Badge variant="secondary" className={cn(FOLDER_STATUS_CLASS[status])}>
      {FOLDER_STATUS_LABEL[status]}
    </Badge>
  );
}

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em progresso",
  DONE: "Concluída",
};

const ITEM_STATUS_CLASS: Record<ItemStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge variant="secondary" className={cn(ITEM_STATUS_CLASS[status])}>
      {ITEM_STATUS_LABEL[status]}
    </Badge>
  );
}

export const ITEM_PRIORITY_LABEL: Record<ItemPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const ITEM_PRIORITY_CLASS: Record<ItemPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  URGENT: "bg-destructive/10 text-destructive",
};

export function ItemPriorityBadge({ priority }: { priority: ItemPriority }) {
  return (
    <Badge variant="secondary" className={cn("gap-1", ITEM_PRIORITY_CLASS[priority])}>
      <Flag className="size-3" />
      {ITEM_PRIORITY_LABEL[priority]}
    </Badge>
  );
}

const DUE_DATE_URGENCY_CLASS = {
  overdue: "bg-destructive/10 text-destructive",
  today: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  soon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  normal: "bg-muted text-muted-foreground",
} as const;

export function ItemDueDateBadge({ dueDate }: { dueDate: string }) {
  const { label, urgency } = formatDueDate(dueDate);
  return (
    <Badge variant="secondary" className={cn(DUE_DATE_URGENCY_CLASS[urgency])}>
      {label}
    </Badge>
  );
}

const WORKSPACE_ROLE_LABEL: Record<WorkspaceRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  GUEST: "Convidado",
};

export function WorkspaceRoleBadge({ role }: { role: WorkspaceRole }) {
  return (
    <Badge variant={role === "OWNER" || role === "ADMIN" ? "default" : "secondary"}>
      {WORKSPACE_ROLE_LABEL[role]}
    </Badge>
  );
}

export const FOLDER_ROLE_LABEL: Record<FolderRole, string> = {
  MEMBER: "Membro",
  GUEST: "Convidado",
};

const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  REVOKED: "Revogado",
  EXPIRED: "Expirado",
};

const INVITATION_STATUS_CLASS: Record<InvitationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ACCEPTED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  REVOKED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-destructive/10 text-destructive",
};

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  return (
    <Badge variant="secondary" className={cn(INVITATION_STATUS_CLASS[status])}>
      {INVITATION_STATUS_LABEL[status]}
    </Badge>
  );
}

const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ACTIVE: "Ativo",
  DISABLED: "Suspenso",
  CLOSED: "Encerrado",
};

const CLIENT_STATUS_CLASS: Record<ClientStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DISABLED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CLOSED: "bg-destructive/10 text-destructive",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant="secondary" className={cn(CLIENT_STATUS_CLASS[status])}>
      {CLIENT_STATUS_LABEL[status]}
    </Badge>
  );
}

const API_KEY_ENVIRONMENT_CLASS: Record<ApiKeyEnvironment, string> = {
  LIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  TEST: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function ApiKeyEnvironmentBadge({ environment }: { environment: ApiKeyEnvironment }) {
  return (
    <Badge variant="secondary" className={cn(API_KEY_ENVIRONMENT_CLASS[environment])}>
      {environment === "LIVE" ? "Produção" : "Teste"}
    </Badge>
  );
}

const WEBHOOK_DELIVERY_STATUS_LABEL: Record<WebhookDeliveryStatus, string> = {
  PENDING: "Pendente",
  SUCCEEDED: "Sucesso",
  FAILED: "Falhou",
};

const WEBHOOK_DELIVERY_STATUS_CLASS: Record<WebhookDeliveryStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  SUCCEEDED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
};

export function WebhookDeliveryStatusBadge({ status }: { status: WebhookDeliveryStatus }) {
  return (
    <Badge variant="secondary" className={cn(WEBHOOK_DELIVERY_STATUS_CLASS[status])}>
      {WEBHOOK_DELIVERY_STATUS_LABEL[status]}
    </Badge>
  );
}
