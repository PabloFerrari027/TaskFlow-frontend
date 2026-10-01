"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUS_LABEL } from "@/components/shared/status-badge";
import { useChangeTaskStatusMutation } from "@/features/tasks/hooks/use-tasks";
import {
  resolveTaskStatus,
  STATUS_CATEGORIES,
  statusesOfCategory,
  useProjectStatusesQuery,
} from "@/features/tasks/hooks/use-workflow-statuses";
import {
  StatusDot,
  WorkflowStatusBadge,
} from "@/features/tasks/components/workflow-status-badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

/**
 * Picks one of the project's etapas (custom statuses), grouped by category.
 * Choosing a category's default etapa sends the category itself (`status`),
 * which also works offline; any other etapa sends its `statusId`.
 */
export function TaskStatusSelect({
  task,
  size = "default",
  silent = false,
  triggerClassName,
  asBadge = false,
}: {
  task: Pick<Task, "id" | "projectId" | "status" | "statusId">;
  size?: "sm" | "default";
  /** Spreadsheet cells: no toast, patched in place (see `useChangeTaskStatusMutation`). */
  silent?: boolean;
  triggerClassName?: string;
  /** Show the current etapa as a badge inside the trigger (table cells). */
  asBadge?: boolean;
}) {
  const statusesQuery = useProjectStatusesQuery(task.projectId);
  const statuses = statusesQuery.data;
  const mutation = useChangeTaskStatusMutation(task.id, { silent });
  const current = resolveTaskStatus(statuses, task);

  // Until the project's etapas load, the three categories stand in.
  const value = current?.id ?? `category:${task.status}`;

  function onChange(next: string) {
    if (next.startsWith("category:")) {
      const category = next.slice("category:".length) as Task["status"];
      mutation.mutate({ status: category });
      return;
    }
    const chosen = statuses?.find((status) => status.id === next);
    if (!chosen) return;
    if (chosen.isDefault) mutation.mutate({ status: chosen.category });
    else mutation.mutate({ statusId: chosen.id, category: chosen.category });
  }

  return (
    <Select value={value} disabled={mutation.isPending} onValueChange={onChange}>
      <SelectTrigger
        size={size}
        aria-label="Etapa da tarefa"
        onClick={(e) => e.stopPropagation()}
        className={cn("w-40", triggerClassName)}
      >
        {asBadge ? (
          <SelectValue>
            <WorkflowStatusBadge
              name={current?.name ?? TASK_STATUS_LABEL[task.status]}
              color={current?.color ?? null}
              category={task.status}
            />
          </SelectValue>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {statuses
          ? STATUS_CATEGORIES.map((category) => {
              const items = statusesOfCategory(statuses, category);
              if (items.length === 0) return null;
              return (
                <SelectGroup key={category}>
                  <SelectLabel>{TASK_STATUS_LABEL[category]}</SelectLabel>
                  {items.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <StatusDot color={status.color} category={status.category} />
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })
          : STATUS_CATEGORIES.map((category) => (
              <SelectItem key={category} value={`category:${category}`}>
                {TASK_STATUS_LABEL[category]}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  );
}
