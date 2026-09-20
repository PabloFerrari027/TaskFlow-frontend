"use client";

import {
  ChevronLeft,
  ChevronRight,
  FolderInput,
  ListTree,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Column actions tucked into a single "more" menu so the column header stays
// clean. Every item has a text label, so nothing is left for the user to guess.
export function SectionActionsBar({
  onRename,
  onCreateSubsection,
  onMove,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: {
  onRename: () => void;
  onCreateSubsection: () => void;
  onMove: () => void;
  // Left/right only make sense for board columns; omit for nested ones.
  onMoveLeft?: (() => void) | null;
  onMoveRight?: (() => void) | null;
  // Omitted for the default column, which can't be deleted.
  onDelete?: (() => void) | null;
}) {
  // A lone column has nowhere to move, so no arrows at all rather than two
  // disabled ones.
  const hasReorder = Boolean(onMoveLeft || onMoveRight);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label="Ações da coluna">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onRename}>
          <Pencil /> Renomear coluna
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCreateSubsection}>
          <ListTree /> Criar subcoluna
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMove}>
          <FolderInput /> Colocar dentro de outra coluna
        </DropdownMenuItem>
        {hasReorder ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!onMoveLeft} onSelect={() => onMoveLeft?.()}>
              <ChevronLeft /> Mover para a esquerda
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!onMoveRight} onSelect={() => onMoveRight?.()}>
              <ChevronRight /> Mover para a direita
            </DropdownMenuItem>
          </>
        ) : null}
        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> Apagar coluna
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
