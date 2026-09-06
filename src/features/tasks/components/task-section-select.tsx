"use client";

import { SectionSelect } from "@/features/tasks/components/section-select";
import { useMoveTaskToSectionMutation } from "@/features/tasks/hooks/use-tasks";

export function TaskSectionSelect({
  projectId,
  taskId,
  sectionId,
}: {
  projectId: string;
  taskId: string;
  sectionId: string;
}) {
  const moveMutation = useMoveTaskToSectionMutation();

  return (
    <SectionSelect
      projectId={projectId}
      value={sectionId}
      disabled={moveMutation.isPending}
      onChange={(next) => {
        if (next !== sectionId) {
          moveMutation.mutate({ taskId, sectionId: next });
        }
      }}
    />
  );
}
