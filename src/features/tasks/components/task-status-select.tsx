"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangeTaskStatusMutation } from "@/features/tasks/hooks/use-tasks";
import type { TaskStatus } from "@/types/task";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em progresso",
  DONE: "Concluída",
};

export function TaskStatusSelect({
  taskId,
  status,
  size = "default",
}: {
  taskId: string;
  status: TaskStatus;
  size?: "sm" | "default";
}) {
  const changeStatusMutation = useChangeTaskStatusMutation(taskId);

  return (
    <Select
      value={status}
      disabled={changeStatusMutation.isPending}
      onValueChange={(next) => changeStatusMutation.mutate({ status: next as TaskStatus })}
    >
      <SelectTrigger size={size} onClick={(e) => e.stopPropagation()} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
