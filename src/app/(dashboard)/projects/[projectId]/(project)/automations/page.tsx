"use client";

import { use } from "react";
import { Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectAutomationsSection } from "@/features/automations/components/project-automations-section";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";

export default function ProjectAutomationsPage(
  props: PageProps<"/projects/[projectId]/automations">
) {
  const { projectId } = use(props.params);
  // Automation endpoints are OWNER/ADMIN of the workspace — the same bar as
  // `canManage` (see canManageAutomations).
  const { project, isLoading, canManage } = useProjectPermission(projectId);

  if (isLoading || !project) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={<Lock className="size-6" />}
        title="Acesso restrito"
        description="Somente Proprietário e Administrador do workspace podem ver e gerenciar automações."
      />
    );
  }

  return <ProjectAutomationsSection key={project.id} project={project} />;
}
