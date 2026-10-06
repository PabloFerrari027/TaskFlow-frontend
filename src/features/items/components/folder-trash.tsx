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
import { useFolderTrashQuery, useRestoreItemMutation } from "@/features/items/hooks/use-items";

function purgeLabel(purgeAt: string) {
  const days = differenceInCalendarDays(new Date(purgeAt), new Date());
  if (days <= 0) return "Será apagada de vez hoje";
  if (days === 1) return "Será apagada de vez amanhã";
  return `Será apagada de vez em ${days} dias`;
}

export function FolderTrash({ folderId }: { folderId: string }) {
  const [page, setPage] = React.useState(1);
  const trashQuery = useFolderTrashQuery(folderId, page);
  const restoreMutation = useRestoreItemMutation();
  const result = trashQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lixeira</CardTitle>
        <CardDescription>
          Itens apagados ficam aqui por 30 dias. Restaurar traz o item de volta para a mesma
          coluna, junto com os subitens que foram apagados com ele.
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
              {result.data.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.parentItemId ? "Subitem · " : ""}
                      Apagada {formatRelativeTime(item.deletedAt)} · {purgeLabel(item.purgeAt)}
                      {item.deletedSubitemCount > 0
                        ? ` · volta com ${item.deletedSubitemCount === 1 ? "1 subitem" : `${item.deletedSubitemCount} subitens`}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(item.id)}
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
