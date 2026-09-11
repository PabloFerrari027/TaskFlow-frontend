"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { useTaskQuery } from "@/features/tasks/hooks/use-tasks";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { TaskSectionSelect } from "@/features/tasks/components/task-section-select";
import { TaskPrioritySelect } from "@/features/tasks/components/task-priority-select";
import { TaskDueDateInput } from "@/features/tasks/components/task-due-date-input";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { SubtaskList } from "@/features/tasks/components/subtask-list";
import { AttachmentsSection } from "@/features/tasks/components/attachments-section";
import { ParticipantsSection } from "@/features/tasks/components/participants-section";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentList } from "@/features/comments/components/comment-list";
import { TaskActivitySection } from "@/features/activity/components/task-activity-section";
import { TaskCustomFieldValuesEditor } from "@/features/custom-fields/components/task-custom-field-values-editor";
import { cn } from "@/lib/utils";

// Shared by the full-screen task page and the side panel — `layout` picks
// between the two-column page grid and a single stacked column for the sheet.
export function TaskDetailView({
  projectId,
  taskId,
  layout = "grid",
}: {
  projectId: string;
  taskId: string;
  layout?: "grid" | "stacked";
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const taskQuery = useTaskQuery(taskId);

  if (taskQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    return <ErrorState error={taskQuery.error} onRetry={() => taskQuery.refetch()} />;
  }

  const task = taskQuery.data;

  return (
    <div className="space-y-6">
      <div className={cn("gap-6", layout === "grid" ? "grid lg:grid-cols-3" : "flex flex-col")}>
        <div className={cn("space-y-6", layout === "grid" ? "lg:col-span-2" : "")}>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold text-foreground">{task.title}</h1>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil /> Editar
              </Button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {task.description || "Sem descrição"}
            </p>
          </Card>

          <Card className="p-5">
            <SubtaskList projectId={projectId} parentTaskId={task.id} sectionId={task.sectionId} />
          </Card>

          <Card className="p-5">
            <AttachmentsSection taskId={task.id} attachments={task.attachments} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Coluna</p>
              <TaskSectionSelect projectId={projectId} taskId={task.id} sectionId={task.sectionId} />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
              <TaskStatusSelect taskId={task.id} status={task.status} />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Responsável</p>
              {task.assigneeId ? (
                <div className="flex items-center gap-2">
                  <MemberAvatar userId={task.assigneeId} />
                  <MemberIdLabel userId={task.assigneeId} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem responsável</p>
              )}
            </div>

            <Separator />

            <ParticipantsSection
              projectId={projectId}
              taskId={task.id}
              participantIds={task.participantIds}
            />

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Prazo</p>
              <TaskDueDateInput taskId={task.id} dueDate={task.dueDate} />
              {task.dueDate ? (
                <p className="text-xs text-muted-foreground">
                  Depois de definido, o prazo só pode ser trocado por outra data.
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Prioridade</p>
              <TaskPrioritySelect taskId={task.id} priority={task.priority} />
              {task.priority ? (
                <p className="text-xs text-muted-foreground">
                  Depois de definida, a prioridade só pode ser trocada por outra.
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Criado por</p>
              {task.createdBy ? (
                <div className="flex items-center gap-2">
                  <MemberAvatar userId={task.createdBy} />
                  <MemberIdLabel userId={task.createdBy} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Criador desconhecido</p>
              )}
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Campos personalizados
            </p>
            <TaskCustomFieldValuesEditor projectId={projectId} taskId={task.id} />
          </Card>
        </div>
      </div>

      {/* Always the last sections on the page, regardless of `layout` — a
          comment thread and the change history read as the closing part of
          a task, after every other detail is already visible. */}
      <Card className="space-y-3 p-5">
        <h3 className="text-sm font-medium text-foreground">Comentários</h3>
        <CommentList taskId={task.id} projectId={projectId} />
        <CommentComposer taskId={task.id} />
      </Card>

      <Card className="p-5">
        <TaskActivitySection taskId={task.id} />
      </Card>

      <TaskFormDialog
        projectId={projectId}
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
