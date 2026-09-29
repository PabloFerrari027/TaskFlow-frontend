"use client";

import { use } from "react";
import { ProjectStatsSection } from "@/features/project-stats/components/project-stats-section";

export default function ProjectStatsPage(props: PageProps<"/projects/[projectId]/stats">) {
  const { projectId } = use(props.params);

  return <ProjectStatsSection key={projectId} projectId={projectId} />;
}
