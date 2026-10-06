"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ItemDetailView } from "@/features/items/components/item-detail-view";
import { useItemPanel } from "@/features/items/hooks/use-item-panel";

// Asana-style side panel: opens over whatever page is showing, driven by the
// `itemId` search param, with a shortcut to jump to the item's own full page.
export function ItemDetailSheet({ folderId }: { folderId: string }) {
  const { openItemId, closeItem } = useItemPanel();

  return (
    <Sheet open={Boolean(openItemId)} onOpenChange={(open) => !open && closeItem()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-4xl">
        {openItemId ? (
          <>
            <SheetHeader className="flex-row items-center justify-between gap-2 pr-12">
              <SheetTitle className="sr-only">Detalhes do item</SheetTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/folders/${folderId}/items/${openItemId}`} onClick={closeItem}>
                  <Maximize2 /> Tela cheia
                </Link>
              </Button>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Keyed by itemId: switching to a different item while the
                  panel stays open re-renders this in place rather than
                  unmounting it, so without this key, local state (activity
                  page number, in-progress comment draft) would leak between
                  items instead of resetting. */}
              <ItemDetailView key={openItemId} folderId={folderId} itemId={openItemId} layout="stacked" />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
