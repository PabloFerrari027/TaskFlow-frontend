"use client";

import * as React from "react";

const STORAGE_PREFIX = "taskflow.sectionColumnWidth.";

// Per-browser display preference — how wide the user dragged a board column
// to be. `null` means "no override, size the column to fill available
// space." Never synced with the server or other viewers.
export function useSectionColumnWidth(sectionId: string) {
  const [width, setWidthState] = React.useState<number | null>(null);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_PREFIX + sectionId);
        const parsed = stored ? Number(stored) : NaN;
        if (Number.isFinite(parsed)) setWidthState(parsed);
      } catch {
        // ignore unavailable storage
      }
    });
  }, [sectionId]);

  const setWidth = React.useCallback(
    (next: number | null) => {
      setWidthState(next);
      try {
        if (next === null) {
          window.localStorage.removeItem(STORAGE_PREFIX + sectionId);
        } else {
          window.localStorage.setItem(STORAGE_PREFIX + sectionId, String(next));
        }
      } catch {
        // ignore unavailable storage
      }
    },
    [sectionId]
  );

  return [width, setWidth] as const;
}
