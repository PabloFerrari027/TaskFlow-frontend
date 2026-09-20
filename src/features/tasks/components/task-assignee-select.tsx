"use client";

import { AssigneeSelect } from "@/features/tasks/components/assignee-select";
import {
  useUnassignTaskMutation,
  useUpdateTaskMutation,
} from "@/features/tasks/hooks/use-tasks";

/**
 * Picking a member goes through the regular PATCH, but clearing the assignee
 * can't (see `useUnassignTaskMutation`), so "Sem responsável" is routed to the
 * dedicated unassign call.
 */
export function TaskAssigneeSelect({
  projectId,
  taskId,
  assigneeId,
}: {
  projectId: string;
  taskId: string;
  assigneeId: string | null;
}) {
  const updateMutation = useUpdateTaskMutation(taskId);
  const unassignMutation = useUnassignTaskMutation(taskId);

  return (
    <div className={updateMutation.isPending || unassignMutation.isPending ? "pointer-events-none opacity-60" : ""}>
      <AssigneeSelect
        projectId={projectId}
        value={assigneeId ?? undefined}
        onChange={(next) => {
          if (next === (assigneeId ?? undefined)) return;
          if (next) updateMutation.mutate({ assigneeId: next });
          else unassignMutation.mutate();
        }}
      />
    </div>
  );
}
