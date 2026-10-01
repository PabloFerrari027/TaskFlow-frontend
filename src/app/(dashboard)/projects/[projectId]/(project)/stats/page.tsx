"use client";

import { use } from "react";
import { ProjectStatsSection } from "@/features/project-stats/components/project-stats-section";
import { ProjectTimeReport } from "@/features/time-tracking/components/project-time-report";

export default function ProjectStatsPage(props: PageProps<"/projects/[projectId]/stats">) {
  const { projectId } = use(props.params);

  return (
    <div className="space-y-6">
      <ProjectStatsSection key={projectId} projectId={projectId} />
      <ProjectTimeReport projectId={projectId} />
    </div>
  );
}
