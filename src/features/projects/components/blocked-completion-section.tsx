"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjectQuery, useUpdateProjectMutation } from "@/features/projects/hooks/use-projects";
import type { BlockedTaskCompletion } from "@/types/project";

const OPTIONS: { value: BlockedTaskCompletion; title: string; description: string }[] = [
  {
    value: "WARN",
    title: "Deixar concluir e avisar",
    description: "A tarefa é concluída normalmente, com um aviso de que algo de que ela depende ainda está aberto.",
  },
  {
    value: "BLOCK",
    title: "Não deixar concluir",
    description: "A tarefa só pode ser concluída depois que todas as tarefas de que ela depende terminarem.",
  },
];

export function BlockedCompletionSection({ projectId }: { projectId: string }) {
  const projectQuery = useProjectQuery(projectId);
  const updateMutation = useUpdateProjectMutation(projectId);
  const current = projectQuery.data?.blockedTaskCompletion ?? "WARN";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concluir tarefas que dependem de outras</CardTitle>
        <CardDescription>
          O que acontece quando alguém conclui uma tarefa que ainda depende de outras não terminadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projectQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div role="radiogroup" aria-label="Regra de dependências" className="grid gap-2 sm:grid-cols-2">
            {OPTIONS.map((option) => {
              const selected = option.value === current;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    if (!selected) updateMutation.mutate({ blockedTaskCompletion: option.value });
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <span className="block text-sm font-medium">{option.title}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
