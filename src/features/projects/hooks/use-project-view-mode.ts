"use client";

import * as React from "react";

// "tree" is the nested card list; "table" is the spreadsheet-style view with
// inline editing.
export type ProjectViewMode = "tree" | "table";

const STORAGE_KEY = "taskflow.projectViewMode";

// Purely a per-browser display preference — persisted to localStorage,
// never synced with the server or other viewers.
export function useProjectViewMode() {
  const [viewMode, setViewModeState] = React.useState<ProjectViewMode>("tree");

  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "tree" || stored === "table") {
          setViewModeState(stored);
        }
      } catch {
        // ignore unavailable storage
      }
    });
  }, []);

  const setViewMode = React.useCallback((mode: ProjectViewMode) => {
    setViewModeState(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  return { viewMode, setViewMode };
}
