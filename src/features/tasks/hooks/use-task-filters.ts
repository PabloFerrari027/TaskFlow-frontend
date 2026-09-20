"use client";

import * as React from "react";
import {
  countActiveFilters,
  EMPTY_TASK_FILTERS,
  type TaskFilters,
} from "@/features/tasks/lib/task-filters";

// Filters are a working view over what's already loaded, not a preference:
// they reset on reload and are never persisted or shared.
export function useTaskFilters() {
  const [filters, setFilters] = React.useState<TaskFilters>(EMPTY_TASK_FILTERS);

  const patchFilters = React.useCallback((patch: Partial<TaskFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = React.useCallback(() => setFilters(EMPTY_TASK_FILTERS), []);

  return {
    filters,
    patchFilters,
    resetFilters,
    activeCount: countActiveFilters(filters),
  };
}
