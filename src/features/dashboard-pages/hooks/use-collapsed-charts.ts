"use client";

import * as React from "react";

const STORAGE_PREFIX = "taskflow.collapsedCharts.";

function readCollapsed(pageId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + pageId) ?? "[]");
    return new Set(
      Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : []
    );
  } catch {
    // unavailable storage or a malformed value: everything starts open
    return new Set();
  }
}

/**
 * Which charts of a page this viewer folded down to their title bar. Purely
 * a per-browser display preference — persisted to localStorage, never sent
 * to the server, never seen by other viewers, never touching a chart's saved
 * position. Works without storage (private windows, the public viewer with
 * site data blocked): the state then just lasts until the page is left.
 *
 * Read in the state initializer rather than an effect: the grid draws
 * nothing until it has measured its width on the client, so the server
 * render never depends on this value and there's no flash of open charts.
 */
export function useCollapsedCharts(pageId: string, chartIds: string[]) {
  const [state, setState] = React.useState(() => ({ pageId, ids: readCollapsed(pageId) }));

  // Same grid, another page (client-side navigation): start from that page's set.
  let current = state;
  if (state.pageId !== pageId) {
    current = { pageId, ids: readCollapsed(pageId) };
    setState(current);
  }

  const toggle = (chartId: string) => {
    const ids = new Set(current.ids);
    if (ids.has(chartId)) ids.delete(chartId);
    else ids.add(chartId);
    setState({ pageId, ids });
    // Charts removed since they were folded drop out of storage here.
    const kept = chartIds.filter((id) => ids.has(id));
    try {
      if (kept.length === 0) window.localStorage.removeItem(STORAGE_PREFIX + pageId);
      else window.localStorage.setItem(STORAGE_PREFIX + pageId, JSON.stringify(kept));
    } catch {
      // ignore unavailable storage
    }
  };

  return { collapsed: current.ids, toggle };
}
