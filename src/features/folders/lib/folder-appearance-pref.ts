export const IGNORE_FOLDER_APPEARANCE_KEY = "taskflow.ignoreFolderAppearance";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * True only when the user opted out of folder appearance (exactly "1"). A
 * missing key, missing storage or a read error mean the preference is off,
 * i.e. folder appearance is NOT ignored. The feature flag is checked apart.
 */
export function readIgnoreFolderAppearance(
  storage: ReadableStorage | null | undefined = defaultStorage(),
): boolean {
  try {
    return storage?.getItem(IGNORE_FOLDER_APPEARANCE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Stores "1" when ignoring, removes the key otherwise. Write errors are swallowed. */
export function writeIgnoreFolderAppearance(
  storage: WritableStorage | null | undefined,
  value: boolean,
): void {
  try {
    if (value) storage?.setItem(IGNORE_FOLDER_APPEARANCE_KEY, "1");
    else storage?.removeItem(IGNORE_FOLDER_APPEARANCE_KEY);
  } catch {
    // Blocked storage: the choice just doesn't persist.
  }
}

// Tiny external store so every reader re-renders when the toggle changes,
// without hitting localStorage on each render. Read lazily once per page.
let cached: boolean | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== IGNORE_FOLDER_APPEARANCE_KEY) return;
  cached = readIgnoreFolderAppearance();
  emit();
}

export function subscribeIgnoreFolderAppearance(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getIgnoreFolderAppearanceSnapshot(): boolean {
  if (cached === null) cached = readIgnoreFolderAppearance();
  return cached;
}

/** Server render (and hydration) never ignores; the client snapshot follows. */
export function getIgnoreFolderAppearanceServerSnapshot(): boolean {
  return false;
}

/** Persists the choice in this browser and notifies every subscriber. */
export function setIgnoreFolderAppearance(value: boolean): void {
  writeIgnoreFolderAppearance(defaultStorage(), value);
  cached = value;
  emit();
}
