export const IGNORE_FOLDER_APPEARANCE_KEY = "taskflow.ignoreFolderAppearance";

type ReadableStorage = Pick<Storage, "getItem">;

function defaultStorage(): ReadableStorage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/**
 * True only when the user opted out of folder appearance ("1"). A missing
 * key, missing storage or a read error all mean "not ignoring" here; callers
 * that need "off on any doubt" must combine this with the feature flag.
 */
export function readIgnoreFolderAppearance(storage: ReadableStorage | undefined = defaultStorage()): boolean {
  try {
    return storage?.getItem(IGNORE_FOLDER_APPEARANCE_KEY) === "1";
  } catch {
    return false;
  }
}
