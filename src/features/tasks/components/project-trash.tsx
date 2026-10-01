"use client";

import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { formatRelativeTime } from "@/lib/format";
import { useProjectTrashQuery, useRestoreTaskMutation } from "@/features/tasks/hooks/use-tasks";

function purgeLabel(purgeAt: string) {
  const days = differenceInCalendarDays(new Date(purgeAt), new Date());
  if (days <= 0) return "Será apagada de vez hoje";
  if (days === 1) return "Será apagada de vez amanhã";
  return `Será apagada de vez em ${days} dias`;
}

export function ProjectTrash({ projectId }: { projectId: string }) {
  const [page, setPage] = React.useState(1);
  const trashQuery = useProjectTrashQuery(projectId, page);
  const restoreMutation = useRestoreTaskMutation();
  const result = trashQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lixeira</CardTitle>
        <CardDescription>
          Tarefas apagadas ficam aqui por 30 dias. Restaurar traz a tarefa de volta para a mesma
          coluna, junto com as subtarefas que foram apagadas com ela.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trashQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : trashQuery.isError && !result ? (
          <ErrorState error={trashQuery.error} onRetry={() => trashQuery.refetch()} />
        ) : !result || result.data.length === 0 ? (
          <EmptyState icon={<Trash2 className="size-6" />} title="A lixeira está vazia" />
        ) : (
          <div className={trashQuery.isPlaceholderData ? "space-y-3 opacity-60" : "space-y-3"}>
            <ul className="divide-y">
              {result.data.map((task) => (
                <li key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.parentTaskId ? "Subtarefa · " : ""}
                      Apagada {formatRelativeTime(task.deletedAt)} · {purgeLabel(task.purgeAt)}
                      {task.deletedSubtaskCount > 0
                        ? ` · volta com ${task.deletedSubtaskCount === 1 ? "1 subtarefa" : `${task.deletedSubtaskCount} subtarefas`}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(task.id)}
                  >
                    <RotateCcw /> Restaurar
                  </Button>
                </li>
              ))}
            </ul>
            <Pager meta={result.meta} isLoading={trashQuery.isFetching} onPageChange={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
