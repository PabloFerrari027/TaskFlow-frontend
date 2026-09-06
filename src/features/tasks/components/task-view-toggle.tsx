"use client";

import { LayoutGrid, List } from "lucide-react";
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
    <div className="flex items-center gap-0.5 rounded-md border border-border/60 p-0.5">
      <Button
        type="button"
        variant={value === "line" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Ver em linha"
        aria-pressed={value === "line"}
        onClick={() => onChange("line")}
      >
        <List />
      </Button>
      <Button
        type="button"
        variant={value === "card" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Ver em cards"
        aria-pressed={value === "card"}
        onClick={() => onChange("card")}
      >
        <LayoutGrid />
      </Button>
    </div>
  );
}
