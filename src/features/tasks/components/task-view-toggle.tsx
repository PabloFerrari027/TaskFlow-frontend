"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskViewMode } from "@/features/tasks/hooks/use-task-view-mode";

export function TaskViewToggle({
  value,
  onChange,
}: {
  value: TaskViewMode;
  onChange: (mode: TaskViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Modo de visualização das tarefas"
      className="flex items-center gap-0.5 rounded-md border border-border/60 p-0.5"
    >
      <Button
        type="button"
        variant={value === "card" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={value === "card"}
        onClick={() => onChange("card")}
      >
        <LayoutGrid /> Cards
      </Button>
      <Button
        type="button"
        variant={value === "table" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
      >
        <Table2 /> Linhas
      </Button>
    </div>
  );
}
