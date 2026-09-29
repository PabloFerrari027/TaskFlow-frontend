"use client";

import { use } from "react";
import { ProjectActivitySection } from "@/features/activity/components/project-activity-section";

export default function ProjectActivityPage(props: PageProps<"/projects/[projectId]/activity">) {
  const { projectId } = use(props.params);

  return <ProjectActivitySection key={projectId} projectId={projectId} />;
}
