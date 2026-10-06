"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SectionSelect } from "@/features/items/components/section-select";
import { useItemSelection } from "@/features/items/context/item-selection-context";
import {
  useDeleteItemsMutation,
  useMoveItemsToSectionMutation,
} from "@/features/items/hooks/use-items";

/**
 * Floating toolbar for the items picked on the board: move them to another
 * column or delete them, all at once. Only rendered while something is selected.
 */
export function ItemSelectionBar({ folderId }: { folderId: string }) {
  const selection = useItemSelection();
  const moveMutation = useMoveItemsToSectionMutation();
  const deleteMutation = useDeleteItemsMutation();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (selection.count === 0) return null;

  const isBusy = moveMutation.isPending || deleteMutation.isPending;
  const countLabel =
    selection.count === 1 ? "1 item selecionado" : `${selection.count} itens selecionados`;

  function handleMove(sectionId: string) {
    // Items already in the destination have nothing to move.
    const toMove = selection.items.filter((item) => item.sectionId !== sectionId);
    if (toMove.length === 0) {
      toast.info("Os itens selecionados já estão nessa coluna.");
      return;
    }
    moveMutation.mutate(
      { items: toMove, sectionId },
      // Keep the ones that failed selected so the move can be retried.
      { onSuccess: ({ movedIds }) => selection.deselect(movedIds) }
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        role="toolbar"
        aria-label="Ações para os itens selecionados"
        className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-lg"
      >
        <span className="px-2 text-sm font-medium text-foreground">{countLabel}</span>
        <div className="w-52">
          <SectionSelect
            folderId={folderId}
            value=""
            placeholder="Mover para…"
            disabled={isBusy}
            onChange={handleMove}
          />
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={isBusy}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 /> Apagar
        </Button>
        <Button variant="ghost" size="sm" disabled={isBusy} onClick={selection.clear}>
          <X /> Limpar seleção
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        trigger={<span className="hidden" />}
        title={
          selection.count === 1
            ? "Apagar o item selecionado?"
            : `Apagar os ${selection.count} itens selecionados?`
        }
        description="Os itens (e os subitens deles) vão para a lixeira da pasta. Dá para restaurar em até 30 dias."
        confirmLabel={selection.count === 1 ? "Apagar item" : "Apagar itens"}
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          // Keep the ones that weren't deleted selected, so it can be retried.
          deleteMutation.mutate(selection.items, {
            onSuccess: ({ deletedIds }) => selection.deselect(deletedIds),
          })
        }
      />
    </div>
  );
}
