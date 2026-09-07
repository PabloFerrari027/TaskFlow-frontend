import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/project";
import type { TaskPriority, TaskStatus } from "@/types/task";
import type { WorkspaceRole } from "@/types/workspace";
import type { InvitationStatus } from "@/types/common";
import type { ClientStatus } from "@/types/client";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
};

const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="secondary" className={cn(PROJECT_STATUS_CLASS[status])}>
      {PROJECT_STATUS_LABEL[status]}
    </Badge>
  );
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em progresso",
  DONE: "Concluída",
};

const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="secondary" className={cn(TASK_STATUS_CLASS[status])}>
      {TASK_STATUS_LABEL[status]}
    </Badge>
  );
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const TASK_PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  URGENT: "bg-destructive/10 text-destructive",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="secondary" className={cn("gap-1", TASK_PRIORITY_CLASS[priority])}>
      <Flag className="size-3" />
      {TASK_PRIORITY_LABEL[priority]}
    </Badge>
  );
}

const DUE_DATE_URGENCY_CLASS = {
  overdue: "bg-destructive/10 text-destructive",
  today: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  soon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  normal: "bg-muted text-muted-foreground",
} as const;

export function TaskDueDateBadge({ dueDate }: { dueDate: string }) {
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
