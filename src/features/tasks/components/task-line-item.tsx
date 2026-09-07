"use client";

import { Paperclip } from "lucide-react";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { TaskDueDateBadge, TaskPriorityBadge } from "@/components/shared/status-badge";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";
import { useTaskDropTarget } from "@/features/tasks/hooks/use-task-drop-target";
import { setLiftedDragImage, TASK_DRAG_MIME } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskLineItemProps {
  task: Task;
  onReorder: (payload: { taskId: string; fromSectionId: string; targetPosition: number }) => void;
}

export function TaskLineItem({ task, onReorder }: TaskLineItemProps) {
  const { openTask } = useTaskPanel();
  const { dropEdge, handleDragOver, handleDragLeave, handleDrop } = useTaskDropTarget(
    task,
    onReorder
  );

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          TASK_DRAG_MIME,
          JSON.stringify({ taskId: task.id, sectionId: task.sectionId })
        );
        e.dataTransfer.effectAllowed = "move";
        setLiftedDragImage(e);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTask(task.id);
        }
      }}
      className={cn(
        "relative flex w-full cursor-grab flex-col gap-2 rounded-md border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/50 active:cursor-grabbing",
        dropEdge === "above" && "shadow-[inset_0_2px_0_0_var(--primary)]",
        dropEdge === "below" && "shadow-[inset_0_-2px_0_0_var(--primary)]"
      )}
    >
      <span className="truncate text-sm font-medium text-foreground">{task.title}</span>
      {task.priority || task.dueDate ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {task.priority ? <TaskPriorityBadge priority={task.priority} /> : null}
          {task.dueDate ? <TaskDueDateBadge dueDate={task.dueDate} /> : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.attachments.length > 0 ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="size-3.5" />
              {task.attachments.length}
            </span>
          ) : null}
          {task.assigneeId ? <MemberAvatar userId={task.assigneeId} /> : null}
        </div>
        <TaskStatusSelect taskId={task.id} status={task.status} size="sm" />
      </div>
    </div>
  );
}
