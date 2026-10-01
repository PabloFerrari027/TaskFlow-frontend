"use client";

import { use } from "react";
import { ProjectTrash } from "@/features/tasks/components/project-trash";

export default function ProjectTrashPage(props: PageProps<"/projects/[projectId]/trash">) {
  const { projectId } = use(props.params);
  return <ProjectTrash projectId={projectId} />;
}
