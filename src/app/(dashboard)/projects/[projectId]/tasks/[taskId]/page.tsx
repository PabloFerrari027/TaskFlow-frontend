"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { useTaskQuery } from "@/features/tasks/hooks/use-tasks";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { SubtaskList } from "@/features/tasks/components/subtask-list";
import { AttachmentsSection } from "@/features/tasks/components/attachments-section";
import { TaskCustomFieldValuesEditor } from "@/features/custom-fields/components/task-custom-field-values-editor";

export default function TaskDetailPage(
  props: PageProps<"/projects/[projectId]/tasks/[taskId]">
) {
  const { projectId, taskId } = use(props.params);
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
      <div>
        <Link
          href={
            task.parentTaskId
              ? `/projects/${projectId}/tasks/${task.parentTaskId}`
              : `/projects/${projectId}/tasks`
          }
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {task.parentTaskId ? "Voltar à tarefa pai" : "Voltar às tarefas"}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
            <SubtaskList projectId={projectId} parentTaskId={task.id} />
          </Card>

          <Card className="p-5">
            <AttachmentsSection taskId={task.id} attachments={task.attachments} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
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
          </Card>

          <Card className="space-y-4 p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Campos personalizados
            </p>
            <TaskCustomFieldValuesEditor projectId={projectId} taskId={task.id} />
          </Card>
        </div>
      </div>

      <TaskFormDialog
        projectId={projectId}
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
