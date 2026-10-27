"use client";

import { Input } from "@/components/ui/input";
import { dueDateFromDay, timeLabel, toDateInputValue } from "@/lib/format";
import { useUpdateItemMutation } from "@/features/items/hooks/use-items";

/**
 * Same "set-only" constraint as priority (API.md § 9) — once a due date is
 * defined it can only be replaced by another date, never cleared, so this
 * never renders a way to blank the field back out.
 */
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
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={toDateInputValue(dueDate)}
        disabled={updateMutation.isPending}
        onChange={(e) => {
          if (!e.target.value) return;
          updateMutation.mutate({ dueDate: dueDateFromDay(e.target.value, { dueDate, dueDateHasTime }) });
        }}
      />
      {/* The day is editable here; a time (set by the assistant, e.g. "consulta às 9h") is kept. */}
      {dueDate && dueDateHasTime ? (
        <span className="shrink-0 text-sm text-muted-foreground">às {timeLabel(dueDate)}</span>
      ) : null}
    </div>
  );
}
