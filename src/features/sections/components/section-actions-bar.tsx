"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderInput,
  ListTree,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function ActionButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// Column actions laid out side by side. Every icon has a text label, shown as
// a tooltip on hover/focus, so nothing is left for the user to guess.
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
    <div className="flex shrink-0 items-center">
      {hasReorder ? (
        <>
          <ActionButton
            label="Mover para a esquerda"
            disabled={!onMoveLeft}
            onClick={() => onMoveLeft?.()}
          >
            <ChevronLeft />
          </ActionButton>
          <ActionButton
            label="Mover para a direita"
            disabled={!onMoveRight}
            onClick={() => onMoveRight?.()}
          >
            <ChevronRight />
          </ActionButton>
        </>
      ) : null}
      <ActionButton label="Renomear coluna" onClick={onRename}>
        <Pencil />
      </ActionButton>
      <ActionButton label="Criar subcoluna" onClick={onCreateSubsection}>
        <ListTree />
      </ActionButton>
      <ActionButton label="Colocar dentro de outra coluna" onClick={onMove}>
        <FolderInput />
      </ActionButton>
      {onDelete ? (
        <ActionButton label="Apagar coluna" onClick={onDelete}>
          <Trash2 className="text-destructive" />
        </ActionButton>
      ) : null}
    </div>
  );
}
