import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/project";
import type { TaskStatus } from "@/types/task";
import type { WorkspaceRole } from "@/types/workspace";
import type { InvitationStatus } from "@/types/common";

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
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

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
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
