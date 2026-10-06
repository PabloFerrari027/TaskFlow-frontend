"use client";

import * as React from "react";
import type { Item } from "@/types/item";

interface ItemSelectionValue {
  /** Selected items in the order they were picked. */
  items: Item[];
  count: number;
  isSelected: (itemId: string) => boolean;
  toggle: (item: Item) => void;
  select: (items: Item[]) => void;
  deselect: (itemIds: string[]) => void;
  clear: () => void;
}

const ItemSelectionContext = React.createContext<ItemSelectionValue | null>(null);

/**
 * Selection is shared by every column of the board (and the dedicated column
 * page), because a bulk action is about the items picked across all of them.
 * Items are stored as snapshots rather than ids: bulk actions need each one's
 * section and version even when its column isn't on screen anymore.
 */
export function ItemSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<ReadonlyMap<string, Item>>(new Map());

  const toggle = React.useCallback((item: Item) => {
    setSelected((current) => {
      const next = new Map(current);
      if (!next.delete(item.id)) next.set(item.id, item);
      return next;
    });
  }, []);

  const select = React.useCallback((items: Item[]) => {
    setSelected((current) => {
      const next = new Map(current);
      for (const item of items) if (!next.has(item.id)) next.set(item.id, item);
      return next;
    });
  }, []);

  const deselect = React.useCallback((itemIds: string[]) => {
    setSelected((current) => {
      const next = new Map(current);
      for (const itemId of itemIds) next.delete(itemId);
      return next.size === current.size ? current : next;
    });
  }, []);

  const clear = React.useCallback(() => setSelected(new Map()), []);

  const value = React.useMemo<ItemSelectionValue>(
    () => ({
      items: [...selected.values()],
      count: selected.size,
      isSelected: (itemId) => selected.has(itemId),
      toggle,
      select,
      deselect,
      clear,
    }),
    [selected, toggle, select, deselect, clear]
  );

  return <ItemSelectionContext value={value}>{children}</ItemSelectionContext>;
}

export function useItemSelection() {
  const context = React.use(ItemSelectionContext);
  if (!context) {
    throw new Error("useItemSelection must be used inside a ItemSelectionProvider");
  }
  return context;
}
