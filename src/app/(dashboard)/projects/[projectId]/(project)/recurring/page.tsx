"use client";

import { use } from "react";
import { RecurringTasksList } from "@/features/recurring-tasks/components/recurring-tasks-list";

export default function ProjectRecurringTasksPage(props: PageProps<"/projects/[projectId]/recurring">) {
  const { projectId } = use(props.params);
  return <RecurringTasksList projectId={projectId} />;
}
