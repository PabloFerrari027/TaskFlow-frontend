"use client";

import { use } from "react";
import { ProjectTimeline } from "@/features/tasks/components/project-timeline";

export default function ProjectTimelinePage(props: PageProps<"/projects/[projectId]/timeline">) {
  const { projectId } = use(props.params);

  return (
    <div data-page-width="full">
      <ProjectTimeline projectId={projectId} />
    </div>
  );
}
