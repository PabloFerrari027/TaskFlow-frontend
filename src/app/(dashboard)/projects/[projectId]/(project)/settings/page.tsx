"use client";

import { use } from "react";
import { WorkflowStatusesSection } from "@/features/tasks/components/workflow-statuses-section";

// Project-wide settings, as stacked sections (never tabs inside a tab).
export default function ProjectSettingsPage(props: PageProps<"/projects/[projectId]/settings">) {
  const { projectId } = use(props.params);

  return (
    <div className="space-y-6">
      <WorkflowStatusesSection projectId={projectId} />
    </div>
  );
}
