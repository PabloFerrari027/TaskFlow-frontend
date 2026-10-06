"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useItemQuery } from "@/features/items/hooks/use-items";
import { ItemDetailView } from "@/features/items/components/item-detail-view";

export default function ItemDetailPage(
  props: PageProps<"/folders/[folderId]/items/[itemId]">
) {
  const { folderId, itemId } = use(props.params);
  const itemQuery = useItemQuery(itemId);

  if (itemQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (itemQuery.isError || !itemQuery.data) {
    return <ErrorState error={itemQuery.error} onRetry={() => itemQuery.refetch()} />;
  }

  const item = itemQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={
            item.parentItemId
              ? `/folders/${folderId}/items/${item.parentItemId}`
              : `/folders/${folderId}/items`
          }
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {item.parentItemId ? "Voltar ao item pai" : "Voltar aos itens"}
        </Link>
      </div>

      {/* Keyed by itemId: subitem/parent-item links navigate between two
          instances of this same page component without unmounting it, so
          without this key, local state inside (activity page number,
          in-progress comment draft) would leak from the old item to the new
          one instead of resetting. */}
      <ItemDetailView key={itemId} folderId={folderId} itemId={itemId} layout="grid" />
    </div>
  );
}
