"use client";

import * as React from "react";

export type TaskViewMode = "line" | "card";

const STORAGE_KEY = "taskflow.taskViewMode";

// Purely a per-browser display preference — persisted to localStorage,
// never synced with the server or other viewers.
export function useTaskViewMode() {
  const [viewMode, setViewModeState] = React.useState<TaskViewMode>("line");

  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "line" || stored === "card") setViewModeState(stored);
      } catch {
        // ignore unavailable storage
      }
    });
  }, []);

  const setViewMode = React.useCallback((mode: TaskViewMode) => {
    setViewModeState(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  return { viewMode, setViewMode };
}
