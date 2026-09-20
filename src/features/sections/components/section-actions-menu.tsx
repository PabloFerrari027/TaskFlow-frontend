"use client";

import { FolderInput, ListTree, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SectionActionsMenu({
  sectionName,
  onCreateSubsection,
  onMove,
}: {
  sectionName: string;
  onCreateSubsection: () => void;
  onMove: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Mais ações de ${sectionName}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onCreateSubsection}>
          <ListTree /> Nova subseção
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMove}>
          <FolderInput /> Mover para…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
