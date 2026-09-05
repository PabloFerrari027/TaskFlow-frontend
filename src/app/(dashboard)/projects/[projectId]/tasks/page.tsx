"use client";

import { use } from "react";
import { TaskList } from "@/features/tasks/components/task-list";

export default function ProjectTasksPage(
  props: PageProps<"/projects/[projectId]/tasks">
) {
  const { projectId } = use(props.params);

  return <TaskList projectId={projectId} canCreate />;
}
