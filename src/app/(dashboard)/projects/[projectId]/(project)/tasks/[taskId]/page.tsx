"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useTaskQuery } from "@/features/tasks/hooks/use-tasks";
import { TaskDetailView } from "@/features/tasks/components/task-detail-view";

export default function TaskDetailPage(
  props: PageProps<"/projects/[projectId]/tasks/[taskId]">
) {
  const { projectId, taskId } = use(props.params);
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

      {/* Keyed by taskId: subtask/parent-task links navigate between two
          instances of this same page component without unmounting it, so
          without this key, local state inside (activity page number,
          in-progress comment draft) would leak from the old task to the new
          one instead of resetting. */}
      <TaskDetailView key={taskId} projectId={projectId} taskId={taskId} layout="grid" />
    </div>
  );
}
