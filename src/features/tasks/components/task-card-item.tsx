"use client";

import { Paperclip } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { TaskDueDateBadge, TaskPriorityBadge } from "@/components/shared/status-badge";
import { TaskCardCover } from "@/features/tasks/components/task-cover";
import { useTaskSelection } from "@/features/tasks/context/task-selection-context";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";
import { useTaskDropTarget } from "@/features/tasks/hooks/use-task-drop-target";
import { setLiftedDragImage, TASK_DRAG_MIME } from "@/lib/dnd";
import { stripMarkdown } from "@/lib/markdown-format";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskCardItemProps {
  task: Task;
  onReorder: (payload: { taskId: string; fromSectionId: string; targetPosition: number }) => void;
}

export function TaskCardItem({ task, onReorder }: TaskCardItemProps) {
  const { openTask } = useTaskPanel();
  const selection = useTaskSelection();
  const isSelected = selection.isSelected(task.id);
  const { dropEdge, handleDragOver, handleDragLeave, handleDrop } = useTaskDropTarget(
    task,
    onReorder
  );

  return (
    <div
      role="button"
      tabIndex={0}
      data-tour="task-card"
      data-tour-href={`/projects/${task.projectId}/tasks/${task.id}`}
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
      onClick={(e) => {
        // With something already selected a click keeps picking (Ctrl/Shift
        // always does); otherwise it opens the task like before.
        if (selection.count > 0 || e.ctrlKey || e.metaKey || e.shiftKey) selection.toggle(task);
        else openTask(task.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTask(task.id);
        }
      }}
      className={cn(
        "group/card relative flex w-full cursor-grab flex-col gap-2.5 rounded-lg border border-border/60 bg-background p-3.5 text-left transition-colors hover:bg-muted/50 active:cursor-grabbing",
        isSelected && "border-primary bg-primary/5 hover:bg-primary/10",
        dropEdge === "above" && "shadow-[inset_0_2px_0_0_var(--primary)]",
        dropEdge === "below" && "shadow-[inset_0_-2px_0_0_var(--primary)]"
      )}
    >
      <Checkbox
        checked={isSelected}
        aria-label={`Selecionar a tarefa “${task.title}”`}
        onCheckedChange={() => selection.toggle(task)}
        // The card opens the task on click and on Enter/Space — neither should
        // fire when the checkbox itself is used.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn(
          // Straddles the card's corner: the 14px padding keeps it off the text.
          "absolute -top-1.5 -left-1.5 z-10 bg-background shadow-xs dark:bg-background",
          // Hidden until hover/focus, but always there once anything is picked
          // and on touch screens where there is no hover.
          !isSelected &&
            selection.count === 0 &&
            "opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        )}
      />

      <TaskCardCover task={task} />

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{task.title}</span>
        {task.attachments.length > 0 ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3.5" />
            {task.attachments.length}
          </span>
        ) : null}
      </div>

      {task.description ? (
        <p className="line-clamp-3 text-xs text-muted-foreground">{stripMarkdown(task.description)}</p>
      ) : null}

      {task.priority || task.dueDate ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {task.priority ? <TaskPriorityBadge priority={task.priority} /> : null}
          {task.dueDate ? <TaskDueDateBadge dueDate={task.dueDate} /> : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {task.assigneeId ? (
          <div className="flex items-center gap-1.5">
            <MemberAvatar userId={task.assigneeId} />
            <MemberIdLabel userId={task.assigneeId} />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sem responsável</span>
        )}
        <TaskStatusSelect taskId={task.id} status={task.status} size="sm" />
      </div>

      <p className="text-[0.7rem] text-muted-foreground">
        Atualizado {formatRelativeTime(task.updatedAt)}
      </p>
    </div>
  );
}
