"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_PRIORITY_LABEL } from "@/components/shared/status-badge";
import { useUpdateItemMutation } from "@/features/items/hooks/use-items";
import type { ItemPriority } from "@/types/item";

const NO_PRIORITY = "__none__";

/** "Sem prioridade" is a real choice: it clears the priority (`null`). */
export function ItemPrioritySelect({
  itemId,
  priority,
}: {
  itemId: string;
  priority: ItemPriority | null;
}) {
  const updateMutation = useUpdateItemMutation(itemId);

  return (
    <Select
      value={priority ?? NO_PRIORITY}
      disabled={updateMutation.isPending}
      onValueChange={(next) => {
        const value = next === NO_PRIORITY ? null : (next as ItemPriority);
        if (value === priority) return;
        updateMutation.mutate({ priority: value });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sem prioridade" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_PRIORITY}>Sem prioridade</SelectItem>
        {(Object.keys(ITEM_PRIORITY_LABEL) as ItemPriority[]).map((p) => (
          <SelectItem key={p} value={p}>
            {ITEM_PRIORITY_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
