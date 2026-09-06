"use client";

import { use } from "react";
import { TaskBoard } from "@/features/tasks/components/task-board";

export default function ProjectTasksPage(
  props: PageProps<"/projects/[projectId]/tasks">
) {
  const { projectId } = use(props.params);

  return <TaskBoard projectId={projectId} canManage />;
}
