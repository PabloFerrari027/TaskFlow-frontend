"use client";

import { use } from "react";
import { CustomFieldsList } from "@/features/custom-fields/components/custom-fields-list";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";

export default function ProjectCustomFieldsPage(
  props: PageProps<"/projects/[projectId]/custom-fields">
) {
  const { projectId } = use(props.params);
  const { canManage } = useProjectPermission(projectId);

  return <CustomFieldsList projectId={projectId} canManage={canManage} />;
}
