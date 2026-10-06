"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFolderQuery, useUpdateFolderMutation } from "@/features/folders/hooks/use-folders";
import type { BlockedItemCompletion } from "@/types/folder";

const OPTIONS: { value: BlockedItemCompletion; title: string; description: string }[] = [
  {
    value: "WARN",
    title: "Deixar concluir e avisar",
    description: "O item é concluído normalmente, com um aviso de que algo de que ele depende ainda está aberto.",
  },
  {
    value: "BLOCK",
    title: "Não deixar concluir",
    description: "O item só pode ser concluído depois que todos os itens de que ele depende terminarem.",
  },
];

export function BlockedCompletionSection({ folderId }: { folderId: string }) {
  const folderQuery = useFolderQuery(folderId);
  const updateMutation = useUpdateFolderMutation(folderId);
  const current = folderQuery.data?.blockedItemCompletion ?? "WARN";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concluir itens que dependem de outros</CardTitle>
        <CardDescription>
          O que acontece quando alguém conclui um item que ainda depende de outros não terminados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {folderQuery.isLoading ? (
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
                    if (!selected) updateMutation.mutate({ blockedItemCompletion: option.value });
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
