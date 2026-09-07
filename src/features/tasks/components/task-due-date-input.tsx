"use client";

import { Input } from "@/components/ui/input";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks";

/**
 * Same "set-only" constraint as priority (API.md § 9) — once a due date is
 * defined it can only be replaced by another date, never cleared, so this
 * never renders a way to blank the field back out.
 */
export function TaskDueDateInput({
  taskId,
  dueDate,
}: {
  taskId: string;
  dueDate: string | null;
}) {
  const updateMutation = useUpdateTaskMutation(taskId);

  return (
    <Input
      type="date"
      value={toDateInputValue(dueDate)}
      disabled={updateMutation.isPending}
      onChange={(e) => {
        if (!e.target.value) return;
        updateMutation.mutate({ dueDate: fromDateInputValue(e.target.value) });
      }}
    />
  );
}
