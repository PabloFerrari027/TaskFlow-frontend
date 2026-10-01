"use client";

import { use } from "react";
import { WorkflowStatusesSection } from "@/features/tasks/components/workflow-statuses-section";
import { BlockedCompletionSection } from "@/features/projects/components/blocked-completion-section";

// Project-wide settings, as stacked sections (never tabs inside a tab).
export default function ProjectSettingsPage(props: PageProps<"/projects/[projectId]/settings">) {
  const { projectId } = use(props.params);

  return (
    <div className="space-y-6">
      <WorkflowStatusesSection projectId={projectId} />
      <BlockedCompletionSection projectId={projectId} />
    </div>
  );
}
