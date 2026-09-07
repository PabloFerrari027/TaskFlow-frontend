"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITY_LABEL } from "@/components/shared/status-badge";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks";
import type { TaskPriority } from "@/types/task";

const NO_PRIORITY = "__none__";

/**
 * The API can only set a priority, never clear one once defined (see API.md
 * § 9) — so a task without a priority yet shows a "Sem prioridade" placeholder
 * that disappears the moment a real value is chosen, and never comes back.
 */
export function TaskPrioritySelect({
  taskId,
  priority,
}: {
  taskId: string;
  priority: TaskPriority | null;
}) {
  const updateMutation = useUpdateTaskMutation(taskId);

  return (
    <Select
      value={priority ?? NO_PRIORITY}
      disabled={updateMutation.isPending}
      onValueChange={(next) => {
        if (next === NO_PRIORITY) return;
        updateMutation.mutate({ priority: next as TaskPriority });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sem prioridade" />
      </SelectTrigger>
      <SelectContent>
        {!priority ? (
          <SelectItem value={NO_PRIORITY} disabled>
            Sem prioridade
          </SelectItem>
        ) : null}
        {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((p) => (
          <SelectItem key={p} value={p}>
            {TASK_PRIORITY_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
