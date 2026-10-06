"use client";

import * as React from "react";
import { ListTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { useSubitemsQuery } from "@/features/items/hooks/use-items";
import { useItemPanel } from "@/features/items/hooks/use-item-panel";
import { ItemStatusSelect } from "@/features/items/components/item-status-select";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";

export function SubitemList({
  folderId,
  parentItemId,
  sectionId,
}: {
  folderId: string;
  parentItemId: string;
  sectionId: string;
}) {
  const subitemsQuery = useSubitemsQuery(parentItemId);
  const [createOpen, setCreateOpen] = React.useState(false);
  const { openItem } = useItemPanel();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Subitens</h3>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus /> Adicionar
        </Button>
      </div>

      {subitemsQuery.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : subitemsQuery.isError ? (
        <ErrorState error={subitemsQuery.error} onRetry={() => subitemsQuery.refetch()} />
      ) : !subitemsQuery.data || subitemsQuery.data.length === 0 ? (
        <EmptyState icon={<ListTree className="size-5" />} title="Nenhum subitem" />
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {subitemsQuery.data.map((subitem) => (
            <div
              key={subitem.id}
              role="button"
              tabIndex={0}
              onClick={() => openItem(subitem.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openItem(subitem.id);
                }
              }}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {subitem.title}
              </span>
              {subitem.assigneeId ? <MemberAvatar userId={subitem.assigneeId} /> : null}
              <ItemStatusSelect item={subitem} size="sm" />
            </div>
          ))}
        </div>
      )}

      <ItemFormDialog
        folderId={folderId}
        parentItemId={parentItemId}
        sectionId={sectionId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
