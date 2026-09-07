const KEY_PREFIX = "taskflow.syncCursor.";

// Per-workspace pull cursor (`since`/`nextCursor` from API.md § 13). Missing
// entirely means "never pulled" — omitting `since` on the request is the
// documented equivalent of `since=0` for an initial full sync.
export function getCursor(workspaceId: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(KEY_PREFIX + workspaceId) ?? undefined;
  } catch {
    return undefined;
  }
}

export function setCursor(workspaceId: string, cursor: string) {
  try {
    window.localStorage.setItem(KEY_PREFIX + workspaceId, cursor);
  } catch {
    // ignore unavailable storage
  }
}
