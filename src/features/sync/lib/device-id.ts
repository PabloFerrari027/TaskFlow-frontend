const STORAGE_KEY = "taskflow.deviceId";

// A stable per-browser id sent with every sync operation (`SyncOperation.deviceId`)
// — generated once and reused for the life of this browser profile.
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}
