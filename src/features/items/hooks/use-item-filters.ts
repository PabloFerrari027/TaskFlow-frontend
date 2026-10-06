"use client";

import * as React from "react";
import {
  countActiveFilters,
  EMPTY_ITEM_FILTERS,
  type ItemFilters,
} from "@/features/items/lib/item-filters";

// Filters are a working view over what's already loaded, not a preference:
// they reset on reload and are never persisted or shared.
export function useItemFilters() {
  const [filters, setFilters] = React.useState<ItemFilters>(EMPTY_ITEM_FILTERS);

  const patchFilters = React.useCallback((patch: Partial<ItemFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = React.useCallback(() => setFilters(EMPTY_ITEM_FILTERS), []);

  return {
    filters,
    patchFilters,
    resetFilters,
    activeCount: countActiveFilters(filters),
  };
}
