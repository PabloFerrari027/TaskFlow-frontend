"use client";

import * as React from "react";
import Link from "next/link";
import { ListTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { useSubtasksQuery } from "@/features/tasks/hooks/use-tasks";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";

export function SubtaskList({
  projectId,
  parentTaskId,
}: {
  projectId: string;
  parentTaskId: string;
}) {
  const subtasksQuery = useSubtasksQuery(parentTaskId);
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Subtarefas</h3>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus /> Adicionar
        </Button>
      </div>

      {subtasksQuery.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : subtasksQuery.isError ? (
        <ErrorState error={subtasksQuery.error} onRetry={() => subtasksQuery.refetch()} />
      ) : !subtasksQuery.data || subtasksQuery.data.length === 0 ? (
        <EmptyState icon={<ListTree className="size-5" />} title="Nenhuma subtarefa" />
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {subtasksQuery.data.map((subtask) => (
            <Link
              key={subtask.id}
              href={`/projects/${projectId}/tasks/${subtask.id}`}
              className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {subtask.title}
              </span>
              {subtask.assigneeId ? <MemberAvatar userId={subtask.assigneeId} /> : null}
              <TaskStatusSelect taskId={subtask.id} status={subtask.status} size="sm" />
            </Link>
          ))}
        </div>
      )}

      <TaskFormDialog
        projectId={projectId}
        parentTaskId={parentTaskId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
