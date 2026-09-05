"use client";

import * as React from "react";
import Link from "next/link";
import { ListChecks, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { RoleGate } from "@/components/shared/role-gate";
import { Pager } from "@/components/shared/pager";
import { useTasksQuery } from "@/features/tasks/hooks/use-tasks";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";

export function TaskList({
  projectId,
  canCreate,
}: {
  projectId: string;
  canCreate: boolean;
}) {
  const [page, setPage] = React.useState(1);
  const tasksQuery = useTasksQuery(projectId, page);
  const [createOpen, setCreateOpen] = React.useState(false);

  const tasks = tasksQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <RoleGate allowed={canCreate}>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Nova tarefa
          </Button>
        </div>
      </RoleGate>

      {tasksQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-6" />}
          title="Nenhuma tarefa ainda"
          description="Crie a primeira tarefa deste projeto."
          action={
            <RoleGate allowed={canCreate}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Nova tarefa
              </Button>
            </RoleGate>
          }
        />
      ) : (
        <>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${projectId}/tasks/${task.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {task.title}
                </span>
                {task.attachments.length > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="size-3.5" />
                    {task.attachments.length}
                  </span>
                ) : null}
                {task.assigneeId ? <MemberAvatar userId={task.assigneeId} /> : null}
                <TaskStatusSelect taskId={task.id} status={task.status} size="sm" />
              </Link>
            ))}
          </div>

          {tasksQuery.data ? (
            <Pager
              meta={tasksQuery.data.meta}
              onPageChange={setPage}
              isLoading={tasksQuery.isFetching}
            />
          ) : null}
        </>
      )}

      <TaskFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
