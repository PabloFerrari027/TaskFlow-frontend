"use client";

import { ListTree, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FolderViewMode } from "@/features/folders/hooks/use-folder-view-mode";

export function FolderViewToggle({
  value,
  onChange,
}: {
  value: FolderViewMode;
  onChange: (mode: FolderViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Modo de visualização das pastas"
      className="flex items-center gap-0.5 rounded-md border border-border/60 p-0.5"
    >
      <Button
        type="button"
        variant={value === "tree" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={value === "tree"}
        onClick={() => onChange("tree")}
      >
        <ListTree /> Lista
      </Button>
      <Button
        type="button"
        variant={value === "table" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
      >
        <Table2 /> Tabela
      </Button>
    </div>
  );
}
