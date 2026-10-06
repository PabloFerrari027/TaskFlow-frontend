"use client";

import * as React from "react";

// Every item list offers the same two views: one detailed card per item, or
// one spreadsheet-style row per item ("table").
export type ItemViewMode = "card" | "table";

const STORAGE_KEY = "taskflow.itemViewMode";

// Purely a per-browser display preference — persisted to localStorage,
// never synced with the server or other viewers.
export function useItemViewMode() {
  const [viewMode, setViewModeState] = React.useState<ItemViewMode>("card");

  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "card" || stored === "table") {
          setViewModeState(stored);
        }
      } catch {
        // ignore unavailable storage
      }
    });
  }, []);

  const setViewMode = React.useCallback((mode: ItemViewMode) => {
    setViewModeState(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  return { viewMode, setViewMode };
}
