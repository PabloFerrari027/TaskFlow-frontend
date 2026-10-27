"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dueDateFromDay, timeLabel, toDateInputValue } from "@/lib/format";
import { useUpdateItemMutation } from "@/features/items/hooks/use-items";

/** The day is editable; a time set by the assistant ("consulta às 9h") is kept. The X clears it. */
export function ItemDueDateInput({
  itemId,
  dueDate,
  dueDateHasTime = false,
}: {
  itemId: string;
  dueDate: string | null;
  dueDateHasTime?: boolean;
}) {
  const updateMutation = useUpdateItemMutation(itemId);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Input
        type="date"
        className="w-36 shrink-0"
        value={toDateInputValue(dueDate)}
        disabled={updateMutation.isPending}
        onChange={(e) => {
          if (!e.target.value) return;
          updateMutation.mutate({ dueDate: dueDateFromDay(e.target.value, { dueDate, dueDateHasTime }) });
        }}
      />
      {dueDate && dueDateHasTime ? (
        <span className="shrink-0 text-sm text-muted-foreground">às {timeLabel(dueDate)}</span>
      ) : null}
      {dueDate ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Tirar o prazo"
          title="Tirar o prazo"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ dueDate: null })}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
