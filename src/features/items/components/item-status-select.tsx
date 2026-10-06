"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_STATUS_LABEL } from "@/components/shared/status-badge";
import { useChangeItemStatusMutation } from "@/features/items/hooks/use-items";
import {
  resolveItemStatus,
  STATUS_CATEGORIES,
  statusesOfCategory,
  useFolderStatusesQuery,
} from "@/features/items/hooks/use-workflow-statuses";
import {
  StatusDot,
  WorkflowStatusBadge,
} from "@/features/items/components/workflow-status-badge";
import { cn } from "@/lib/utils";
import type { Item } from "@/types/item";

/**
 * Picks one of the folder's etapas (custom statuses), grouped by category.
 * Choosing a category's default etapa sends the category itself (`status`),
 * which also works offline; any other etapa sends its `statusId`.
 */
export function ItemStatusSelect({
  item,
  size = "default",
  silent = false,
  triggerClassName,
  asBadge = false,
}: {
  item: Pick<Item, "id" | "folderId" | "status" | "statusId">;
  size?: "sm" | "default";
  /** Spreadsheet cells: no toast, patched in place (see `useChangeItemStatusMutation`). */
  silent?: boolean;
  triggerClassName?: string;
  /** Show the current etapa as a badge inside the trigger (table cells). */
  asBadge?: boolean;
}) {
  const statusesQuery = useFolderStatusesQuery(item.folderId);
  const statuses = statusesQuery.data;
  const mutation = useChangeItemStatusMutation(item.id, { silent });
  const current = resolveItemStatus(statuses, item);

  // Until the folder's etapas load, the three categories stand in.
  const value = current?.id ?? `category:${item.status}`;

  function onChange(next: string) {
    if (next.startsWith("category:")) {
      const category = next.slice("category:".length) as Item["status"];
      mutation.mutate({ status: category });
      return;
    }
    const chosen = statuses?.find((status) => status.id === next);
    if (!chosen) return;
    if (chosen.isDefault) mutation.mutate({ status: chosen.category });
    else mutation.mutate({ statusId: chosen.id, category: chosen.category });
  }

  return (
    <Select value={value} disabled={mutation.isPending} onValueChange={onChange}>
      <SelectTrigger
        size={size}
        aria-label="Etapa do item"
        onClick={(e) => e.stopPropagation()}
        className={cn("w-40", triggerClassName)}
      >
        {asBadge ? (
          <SelectValue>
            <WorkflowStatusBadge
              name={current?.name ?? ITEM_STATUS_LABEL[item.status]}
              color={current?.color ?? null}
              category={item.status}
            />
          </SelectValue>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {statuses
          ? STATUS_CATEGORIES.map((category) => {
              const items = statusesOfCategory(statuses, category);
              if (items.length === 0) return null;
              return (
                <SelectGroup key={category}>
                  <SelectLabel>{ITEM_STATUS_LABEL[category]}</SelectLabel>
                  {items.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <StatusDot color={status.color} category={status.category} />
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })
          : STATUS_CATEGORIES.map((category) => (
              <SelectItem key={category} value={`category:${category}`}>
                {ITEM_STATUS_LABEL[category]}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  );
}
