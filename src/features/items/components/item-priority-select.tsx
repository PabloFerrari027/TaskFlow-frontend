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

/**
 * The API can only set a priority, never clear one once defined (see API.md
 * § 9) — so o item without a priority yet shows a "Sem prioridade" placeholder
 * that disappears the moment a real value is chosen, and never comes back.
 */
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
        if (next === NO_PRIORITY) return;
        updateMutation.mutate({ priority: next as ItemPriority });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sem prioridade" />
      </SelectTrigger>
      <SelectContent>
        {!priority ? (
          <SelectItem value={NO_PRIORITY} disabled>
            Sem prioridade
          </SelectItem>
        ) : null}
        {(Object.keys(ITEM_PRIORITY_LABEL) as ItemPriority[]).map((p) => (
          <SelectItem key={p} value={p}>
            {ITEM_PRIORITY_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
