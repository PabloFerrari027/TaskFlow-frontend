"use client";

import { use } from "react";
import { ProjectMembersTable } from "@/features/projects/components/project-members-table";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";

export default function ProjectMembersPage(
  props: PageProps<"/projects/[projectId]/members">
) {
  const { projectId } = use(props.params);
  const { canManage } = useProjectPermission(projectId);

  return <ProjectMembersTable projectId={projectId} canManage={canManage} />;
}
